import { GoogleGenAI, GenerateContentParameters } from "@google/genai";
import { checkRateLimitAndUsage, trackAIUsage } from "./aiTrackingService";

// ─── Model Constants ────────────────────────────────────────────────────────
// Centralized so you only need to update one place when models change.
const MODELS = {
  FLASH_LITE: 'gemini-2.0-flash-lite',       // Fast & cheap — most tasks
  FLASH:      'gemini-2.0-flash',             // Mid-tier — parsing, generation
  PRO:        'gemini-2.5-pro-preview-03-25', // Best quality — deep analysis
} as const;

// ─── API Key ────────────────────────────────────────────────────────────────
// Support both AI Studio (process.env.API_KEY) and Vite/Vercel (import.meta.env.VITE_GEMINI_API_KEY)
const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  return '';
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

// ─── Cache ───────────────────────────────────────────────────────────────────
const CACHE_KEY = 'resumeForge_ai_cache';

const loadCache = (): Map<string, string> => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return new Map(JSON.parse(cached));
  } catch (e) {
    console.error("Failed to load AI cache", e);
  }
  return new Map();
};

const aiCache = loadCache();

/**
 * Fast, non-cryptographic hash for building compact cache keys.
 * Avoids storing massive prompt strings as localStorage keys.
 */
const hashString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Core API Wrapper ─────────────────────────────────────────────────────────
const callGeminiAPI = async (
  functionName: string,
  params: GenerateContentParameters,
  useCache: boolean = true,
  retryCount = 0
): Promise<string> => {
  const promptText =
    typeof params.contents === 'string'
      ? params.contents
      : JSON.stringify(params.contents);

  // Use a compact hash so cache keys don't balloon in localStorage
  const cacheKey = `${functionName}_${hashString(promptText)}`;

  if (useCache && aiCache.has(cacheKey)) {
    console.log(`[Cache Hit] ${functionName}`);
    return aiCache.get(cacheKey)!;
  }

  try {
    // 1. Check rate limits before API call
    await checkRateLimitAndUsage();

    // 2. Make the API call
    const mergedParams: GenerateContentParameters = {
      ...params,
      config: { ...params.config },
    };

    const response = await ai.models.generateContent(mergedParams);
    const responseText = response.text || "";

    // 3. Track usage
    await trackAIUsage(functionName, mergedParams.model, promptText, responseText);

    // 4. Persist to cache
    if (useCache && responseText) {
      aiCache.set(cacheKey, responseText);

      // Simple LRU eviction — keep max 50 entries
      if (aiCache.size > 50) {
        const firstKey = aiCache.keys().next().value;
        if (firstKey) aiCache.delete(firstKey);
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(aiCache.entries())));
    }

    return responseText;
  } catch (error: any) {
    // Exponential backoff on rate limit errors (max 3 retries)
    if (
      error.message?.includes("Please wait before making another request") &&
      retryCount < 3
    ) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.warn(`[Rate Limit] Retrying ${functionName} in ${delay}ms... (Attempt ${retryCount + 1})`);
      await sleep(delay);
      return callGeminiAPI(functionName, params, useCache, retryCount + 1);
    }
    throw error;
  }
};

// ─── Exported Service Functions ───────────────────────────────────────────────

export const generateSummary = async (resumeContext: string, jobRole?: string): Promise<string> => {
  try {
    const prompt = `
      You are a senior resume strategist specializing in ATS-optimized summaries for competitive tech roles.

      Write a concise, high-impact professional resume summary (3–4 sentences).

      Candidate Context:
      ${resumeContext}

      ${jobRole ? `Target Job Role: ${jobRole}` : ''}

      STRICT RULES:
      1. Start directly with the candidate's job title.
      2. Do NOT use first-person language.
      3. Do NOT use generic phrases such as "hardworking individual", "strong foundation", or "results-driven professional" unless clearly supported by measurable context.
      4. Highlight technical expertise, specialization, and value delivered.
      5. If measurable achievements are present, incorporate them naturally.
      6. If a Target Job Role is provided, subtly align wording with its responsibilities and keywords without inventing new skills.
      7. Use confident, precise language and avoid passive voice.
      8. Do NOT fabricate experiences, metrics, tools, or certifications.

      Return ONLY the final summary text.
    `;

    const responseText = await callGeminiAPI('generateSummary', {
      model: MODELS.FLASH_LITE,
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 0 } },
    }, true);

    return responseText || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const improveDescription = async (text: string, type: 'experience' | 'project'): Promise<string> => {
  try {
    const prompt = `
      You are an expert resume writer. Improve the following ${type} description to be more professional, impact-oriented, and ATS-friendly.
      
      Rules:
      1. Use strong active verbs.
      2. Quantify results if numbers exist in the source text.
      3. Optimize for ATS keywords.
      4. CRITICAL: Do NOT invent new facts, numbers, or specific technologies not present in the source.
      5. Preserve factual accuracy while improving flow and impact.
      
      Current Text:
      "${text}"
      
      Return ONLY the improved text as bullet points (if applicable) or a paragraph. Do not add conversational filler.
    `;

    const responseText = await callGeminiAPI('improveDescription', {
      model: MODELS.FLASH_LITE,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.4,
      },
    }, true);

    return responseText || text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const tailorResumeToJob = async (currentResumeJSON: string, jobDescription: string): Promise<string> => {
  try {
    const prompt = `
      You are an expert AI Resume Optimizer dedicated to ATS optimization and truthfulness.
      I will provide a resume in JSON format and a Job Description (JD).
      
      Your Goal: Tailor the resume to match the JD keywords and requirements WITHOUT inventing new facts.

      STRICT RULES:
      1. Read the existing resume details carefully.
      2. DO NOT invent, fabricate, or exaggerate experience, skills, or achievements.
      3. ONLY use facts present in the input resume. If a skill required by the JD is not in the resume, DO NOT add it.
      4. Rewrite the 'Summary' to align with JD keywords using the candidate's actual experience.
      5. Rewrite 'Experience' bullet points to use ATS-friendly action verbs and keywords from the JD, but keep the core meaning and metrics identical.
      6. Reorder 'Skills' to prioritize those found in the JD.
      7. Ensure the final output is ATS-friendly text.
      
      Resume JSON:
      ${currentResumeJSON}
      
      Job Description:
      ${jobDescription}
      
      Return the output strictly as a valid JSON object matching the schema of the input resume. 
      Do NOT wrap in markdown code blocks. Just the raw JSON string.
    `;

    const responseText = await callGeminiAPI('tailorResumeToJob', {
      model: MODELS.FLASH_LITE,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.6,
      },
    }, false); // Don't cache — users may tweak the JD and expect fresh results

    return responseText || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const transformResumeForRole = async (currentResumeJSON: string, targetRole: string, jobDescription?: string): Promise<string> => {
  try {
    const prompt = `
      You are an expert Resume Strategist.
      I have a parsed resume (JSON) and a Target Job Role: "${targetRole}".
      ${jobDescription ? `\nHere is the Job Description / Requirements:\n"""\n${jobDescription}\n"""\n` : ''}
      
      Your Goal: Rewrite the resume content to position the candidate as a strong fit for this role${jobDescription ? ' and the provided job description' : ''}, using ONLY their existing experience.

      STRICT RULES:
      1. Rewrite the "Summary" to highlight experience relevant to ${targetRole}${jobDescription ? ' and the job description' : ''}.
      2. Update "Experience" bullet points to emphasize skills valued in ${targetRole}${jobDescription ? ' and match keywords from the job description' : ''} (e.g. leadership, technical depth, communication) depending on the role.
      3. Re-order "Skills" to put the most relevant ones first.
      4. DO NOT invent new facts. If the candidate lacks experience, do not fake it. Just present what they have in the best light.
      5. Ensure the "Job Title" in Personal Info matches the target role (or is "Aspiring ${targetRole}" if they are junior).

      Resume JSON:
      ${currentResumeJSON}
      
      Return the output strictly as a valid JSON object matching the schema.
    `;

    const responseText = await callGeminiAPI('transformResumeForRole', {
      model: MODELS.FLASH_LITE,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.5,
      },
    });

    return responseText || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const fitResumeToOnePage = async (currentResumeJSON: string): Promise<string> => {
  try {
    const prompt = `
      You are an expert resume writer and formatter. The following resume is slightly too long and spills over to a second page.
      Your task is to intelligently trim the content to make it fit on a single page.
      
      Guidelines:
      1. Make sentences more concise and punchy. Remove "fluff" words.
      2. Combine redundant bullet points in the experience and project sections.
      3. Preserve all high-impact metrics, numbers, and key achievements.
      4. Do NOT remove entire jobs, projects, or education entries. Only shorten their descriptions.
      5. Keep the professional summary under 3 sentences.
      
      Return the updated resume in the EXACT same JSON structure as the input.
      Do not add any markdown formatting like \`\`\`json, just return the raw JSON object.
      
      Input Resume JSON:
      ${currentResumeJSON}
    `;

    const responseText = await callGeminiAPI('fitResumeToOnePage', {
      model: MODELS.FLASH_LITE,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    return responseText || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const parseResumeContent = async (text: string): Promise<string> => {
  try {
    const prompt = `
      You are an advanced AI Resume Parser specializing in extracting structured data from unstructured resume text.
      Your task is to accurately identify sections (Personal Info, Education, Experience, Projects, Skills, Certifications) and map them to the JSON schema below.

      **Input Text:**
      """
      ${text}
      """

      **Output Schema (JSON):**
      {
        "personalInfo": {
          "fullName": "Extract full name",
          "email": "Extract email address",
          "phone": "Extract phone number",
          "linkedin": "Extract LinkedIn URL",
          "portfolio": "Extract Portfolio/Website URL",
          "githubUrl": "Extract GitHub URL",
          "location": "Extract City, State/Country",
          "summary": "Extract professional summary/objective"
        },
        "education": [
          {
            "id": "generated-unique-id",
            "institution": "University/School Name",
            "degree": "Degree/Certificate Name",
            "startDate": "Start Year/Date",
            "endDate": "End Year/Date (or Present)",
            "gpa": "GPA/Grade if available"
          }
        ],
        "experience": [
          {
            "id": "generated-unique-id",
            "company": "Company Name",
            "role": "Job Title",
            "startDate": "Start Date",
            "endDate": "End Date",
            "description": "Full description of responsibilities and achievements. Maintain bullet points as newlines if possible, or combine into a coherent paragraph."
          }
        ],
        "projects": [
          {
            "id": "generated-unique-id",
            "name": "Project Name",
            "technologies": "List of technologies used (e.g., React, Node.js)",
            "link": "Project URL if available",
            "description": "Brief description of the project"
          }
        ],
        "skills": ["List", "of", "skills"],
        "certifications": ["List of certifications"],
        "achievements": ["List of awards or achievements"]
      }

      **Parsing Rules:**
      1. **Section Identification:** Look for common headers (e.g., "Work Experience", "Employment History", "Education", "Academic Background", "Skills", "Core Competencies"). If headers are missing, infer based on content patterns (e.g., dates + company names usually indicate experience).
      2. **Skills:** If skills are categorized (e.g., "Languages: Java, Python", "Tools: Git, Docker"), flatten them into a single array of strings.
      3. **Experience vs Projects:** Distinguish between professional employment (Experience) and academic/side projects (Projects).
      4. **Dates:** Keep dates as text strings (e.g., "Jan 2020", "2020", "Present").
      5. **Missing Data:** If a field is not found, use an empty string "" or empty array [].
      6. **IDs:** Generate a unique short string ID for every object in arrays.
      7. **Output:** Return **ONLY** the raw JSON object. Do not wrap in markdown code blocks.
    `;

    const responseText = await callGeminiAPI('parseResumeContent', {
      model: MODELS.FLASH, // Mid-tier: better parsing accuracy than flash-lite
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    return responseText || "{}";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateResumeByRole = async (role: string, level: string, jobDescription?: string): Promise<string> => {
  try {
    const prompt = `
      You are an expert Resume Writer. Generate a realistic, high-quality sample resume for a ${level} ${role}.
      ${jobDescription ? `\nHere is the Job Description to tailor the resume to:\n"""\n${jobDescription}\n"""\nMake sure the generated resume highlights skills and experiences relevant to these requirements.` : ''}
      
      The resume should include:
      - A strong professional summary.
      - 2-3 relevant work experiences with detailed, impact-driven bullet points (ATS friendly).
      - Relevant technical and soft skills.
      - Appropriate education.
      - 1-2 relevant side projects.
      - Relevant certifications and achievements if applicable.

      Output Structure (JSON):
      {
        "personalInfo": { "fullName": "[Placeholder Name]", "email": "email@example.com", "phone": "123-456-7890", "linkedin": "linkedin.com/in/candidate", "portfolio": "", "githubUrl": "", "location": "City, Country", "summary": "..." },
        "education": [{ "id": "generated-id-1", "institution": "University Name", "degree": "Degree Name", "startDate": "YYYY", "endDate": "YYYY", "gpa": "3.X" }],
        "experience": [{ "id": "generated-id-2", "company": "Tech Corp", "role": "${role}", "startDate": "YYYY", "endDate": "Present", "description": "..." }],
        "projects": [{ "id": "generated-id-3", "name": "Project Name", "technologies": "Tech Stack", "link": "", "description": "..." }],
        "skills": ["Skill 1", "Skill 2"],
        "certifications": ["Relevant Cert 1"],
        "achievements": ["Relevant Achievement 1"]
      }

      Return ONLY valid JSON.
    `;

    const responseText = await callGeminiAPI('generateResumeByRole', {
      model: MODELS.FLASH_LITE,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.6,
      },
    });

    return responseText || "{}";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const getSkillSuggestions = async (jobTitle: string, currentSkills: string[] = []): Promise<string[]> => {
  try {
    let prompt = "";

    // FIX: use .trim().length to correctly handle empty string jobTitle
    if (jobTitle && jobTitle.trim().length > 0) {
      prompt = `
        You are a career expert. List 15 relevant technical and soft skills for the job role: "${jobTitle}".
        Return ONLY a JSON array of strings. Do not include markdown formatting.
      `;
    } else if (currentSkills.length > 0) {
      prompt = `
        You are a career expert. Based on these skills: "${currentSkills.join(', ')}", suggest 15 related or complementary skills.
        Return ONLY a JSON array of strings. Do not include markdown formatting.
      `;
    } else {
      // Fallback if no context provided
      return ["Communication", "Leadership", "Problem Solving", "Teamwork", "Time Management", "Critical Thinking"];
    }

    const responseText = await callGeminiAPI('getSkillSuggestions', {
      model: MODELS.FLASH_LITE,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.6,
      },
    }, true);

    return JSON.parse(responseText || "[]");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateCoverLetter = async (
  resumeContext: string,
  companyName: string,
  jobRole: string,
  hiringManager: string = "Hiring Manager",
  jobDescription?: string
): Promise<string> => {
  try {
    const prompt = `
      You are an expert career coach and writer. Write a compelling, professional cover letter for a candidate applying for the position of "${jobRole}" at "${companyName}".

      Candidate's Resume Details:
      ${resumeContext}

      Hiring Manager Name: ${hiringManager}

      ${jobDescription ? `Job Description / Requirements:\n"""\n${jobDescription}\n"""\n` : ''}

      Requirements:
      1. Format as a standard business letter.
      2. Use a professional, enthusiastic tone.
      3. Connect the candidate's specific experience (from resume details) to the role${jobDescription ? ' and the provided Job Description requirements' : ''}.
      4. Highlight why they are a good fit for ${companyName}.
      5. Keep it concise (approx 300-400 words).
      6. Do NOT include placeholders like [Insert Name] unless absolutely necessary; use the provided context.

      Return ONLY the body of the cover letter (including salutation and closing), no markdown formatting or explanations.
    `;

    const responseText = await callGeminiAPI('generateCoverLetter', {
      model: MODELS.FLASH_LITE,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.8,
      },
    }, false); // FIX: don't cache — cover letters are personalized per company/role

    return responseText || "Error generating cover letter. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating cover letter. Please try again.";
  }
};

export const calculateATSScore = async (resumeText: string): Promise<{ score: number; suggestions: string[]; analysis: string }> => {
  try {
    const prompt = `
      You are an expert Applicant Tracking System (ATS) auditor. Analyze the following resume text and provide an ATS score (0-100) and specific suggestions for improvement.
      
      Resume Text:
      """
      ${resumeText}
      """
      
      Evaluation Criteria:
      1. Keyword Optimization: Presence of industry-standard skills and terminology.
      2. Formatting: Is the structure logical and easy for a machine to parse?
      3. Impact: Are achievements quantified?
      4. Contact Info: Is essential contact information present?
      5. Section Clarity: Are standard headers used?
      
      Return the response strictly as a JSON object with the following structure:
      {
        "score": number,
        "suggestions": ["string", "string", ...],
        "analysis": "A brief overall analysis of the resume's ATS friendliness"
      }
      
      Do NOT include markdown formatting.
    `;

    const responseText = await callGeminiAPI('calculateATSScore', {
      model: MODELS.FLASH_LITE,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    return JSON.parse(responseText || '{"score": 0, "suggestions": [], "analysis": "Failed to analyze."}');
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { score: 0, suggestions: ["Error analyzing resume."], analysis: "An error occurred during analysis." };
  }
};

// FIX: Renamed from analyzeResumeFormATS → analyzeResumeFromATS (typo fix)
export const analyzeResumeFromATS = async (resumeText: string): Promise<{ score: number; matched_keywords: string[]; missing_keywords: string[]; weak_sections: string[]; suggestion: string }> => {
  try {
    const prompt = `You are an ATS expert. Analyze the resume details below and return 
ONLY a JSON response, no extra text:
{
  "score": <number 0-100>,
  "matched_keywords": [<list of strong keywords found>],
  "missing_keywords": [<list of important missing keywords>],
  "weak_sections": [<list of sections that need improvement>],
  "suggestion": "<one line tip to improve>"
}

Candidate Details:
${resumeText}`;

    const responseText = await callGeminiAPI('analyzeResumeFromATS', {
      model: MODELS.PRO, // FIX: was 'gemini-3.1-pro-preview' (doesn't exist)
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    return JSON.parse(responseText || '{"score": 0, "matched_keywords": [], "missing_keywords": [], "weak_sections": [], "suggestion": "Failed to analyze."}');
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const improveResumeWithAI = async (resumeText: string): Promise<any> => {
  try {
    const prompt = `You are a professional resume writer and ATS optimization expert. 
Using ONLY the details provided below, rewrite and restructure this 
resume content to maximize ATS score. 

STRICT RULES:
- Do NOT invent, add, or assume any information not given below
- Do NOT add fake metrics or companies
- Do NOT add any new technologies, skills, or tools to the projects or skills list that are not explicitly mentioned in the input.
- Only enhance the language, structure, and keyword usage
- Use strong action verbs for experience and projects
- Provide an ATS analysis based on the IMPROVED resume.
- Return the result as JSON only, no extra text:
{
  "improvedResume": {
    "name": "<n>",
    "title": "<optimized title>",
    "summary": "<strong 3 line professional summary>",
    "skills": ["<optimized skills list>"],
    "experience": [{"company": "<company>", "role": "<role>", "startDate": "<startDate>", "endDate": "<endDate>", "description": "<rewritten experience with strong action verbs>"}],
    "projects": [{"name": "<n>", "technologies": "<technologies>", "description": "<rewritten projects with impact focus>"}],
    "education": [{"institution": "<institution>", "degree": "<degree>", "startDate": "<startDate>", "endDate": "<endDate>"}],
    "certifications": ["<certifications as is>"]
  },
  "atsAnalysis": {
    "score": <number 0-100>,
    "matched_keywords": ["<list of strong keywords found>"],
    "missing_keywords": ["<list of important missing keywords>"],
    "weak_sections": ["<list of sections that need improvement>"],
    "suggestion": "<one line tip to improve>"
  }
}

Candidate Details:
${resumeText}`;

    const responseText = await callGeminiAPI('improveResumeWithAI', {
      model: MODELS.PRO, // FIX: was 'gemini-3.1-pro-preview' (doesn't exist)
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    return JSON.parse(responseText || '{}');
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};