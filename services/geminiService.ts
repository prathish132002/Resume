import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || ''; 

const ai = new GoogleGenAI({ apiKey });

export const generateSummary = async (resumeContext: string, jobRole?: string): Promise<string> => {
  try {
    const prompt = `
      You are an expert career coach. Write a professional resume summary (3-4 sentences) for a candidate.
      
      Candidate Context: ${resumeContext}
      
      ${jobRole ? `Target Job Role: ${jobRole}` : ''}
      
      Rules:
      1. The summary must be ATS-friendly and impactful.
      2. Highlight key strengths based ONLY on the provided context.
      3. Do NOT invent experiences, skills, or numbers not mentioned in the context.
      4. If a Target Job Role is provided, align the summary to that role using existing facts.
      
      Return ONLY the summary text, no explanations.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating summary. Please check your API key.";
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

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return text; // Fallback to original
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

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const transformResumeForRole = async (currentResumeJSON: string, targetRole: string): Promise<string> => {
  try {
    const prompt = `
      You are an expert Resume Strategist.
      I have a parsed resume (JSON) and a Target Job Role: "${targetRole}".
      
      Your Goal: Rewrite the resume content to position the candidate as a strong fit for this role, using ONLY their existing experience.

      STRICT RULES:
      1. Rewrite the "Summary" to highlight experience relevant to ${targetRole}.
      2. Update "Experience" bullet points to emphasize skills valued in ${targetRole} (e.g. leadership, technical depth, communication) depending on the role.
      3. Re-order "Skills" to put the most relevant ones first.
      4. DO NOT invent new facts. If the candidate lacks experience, do not fake it. Just present what they have in the best light.
      5. Ensure the "Job Title" in Personal Info matches the target role (or is "Aspiring ${targetRole}" if they are junior).

      Resume JSON:
      ${currentResumeJSON}
      
      Return the output strictly as a valid JSON object matching the schema.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    return response.text || "";
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

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    return response.text || "{}";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateResumeByRole = async (role: string, level: string): Promise<string> => {
  try {
    const prompt = `
      You are an expert Resume Writer. Generate a realistic, high-quality sample resume for a ${level} ${role}.
      
      The resume should include:
      - A strong professional summary.
      - 2-3 relevant work experiences with detailed, impact-driven bullet points (ATS friendly).
      - Relevant technical and soft skills.
      - Appropriate education.
      - 1-2 relevant side projects.
      - Relevant certifications and achievements if applicable.

      Output Structure (JSON):
      {
        "personalInfo": { "fullName": "[Placeholder Name]", "email": "email@example.com", "phone": "123-456-7890", "linkedin": "linkedin.com/in/candidate", "portfolio": "", "location": "City, Country", "summary": "..." },
        "education": [{ "id": "generated-id-1", "institution": "University Name", "degree": "Degree Name", "startDate": "YYYY", "endDate": "YYYY", "gpa": "3.X" }],
        "experience": [{ "id": "generated-id-2", "company": "Tech Corp", "role": "${role}", "startDate": "YYYY", "endDate": "Present", "description": "..." }],
        "projects": [{ "id": "generated-id-3", "name": "Project Name", "technologies": "Tech Stack", "link": "", "description": "..." }],
        "skills": ["Skill 1", "Skill 2"],
        "certifications": ["Relevant Cert 1"],
        "achievements": ["Relevant Achievement 1"]
      }

      Return ONLY valid JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    return response.text || "{}";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const getSkillSuggestions = async (jobTitle: string, currentSkills: string[] = []): Promise<string[]> => {
  try {
    let prompt = "";
    if (jobTitle) {
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
         // Fallback if no context
         return ["Communication", "Leadership", "Problem Solving", "Teamwork", "Time Management", "Critical Thinking"];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};

export const generateCoverLetter = async (
  resumeContext: string,
  companyName: string,
  jobRole: string,
  hiringManager: string = "Hiring Manager"
): Promise<string> => {
  try {
    const prompt = `
      You are an expert career coach and writer. Write a compelling, professional cover letter for a candidate applying for the position of "${jobRole}" at "${companyName}".

      Candidate's Resume Details:
      ${resumeContext}

      Hiring Manager Name: ${hiringManager}

      Requirements:
      1. Format as a standard business letter.
      2. Use a professional, enthusiastic tone.
      3. Connect the candidate's specific experience (from resume details) to the role.
      4. Highlight why they are a good fit for ${companyName}.
      5. Keep it concise (approx 300-400 words).
      6. Do NOT include placeholders like [Insert Name] unless absolutely necessary; use the provided context.

      Return ONLY the body of the cover letter (including salutation and closing), no markdown formatting or explanations.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "Failed to generate cover letter.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating cover letter. Please try again.";
  }
};