import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { Resume } from '../types';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

(pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;

export const generateAtsClassicPdf = (resume: Resume) => {
  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: resume.personalInfo.fullName, style: 'header' },
      { text: `${resume.personalInfo.email} | ${resume.personalInfo.phone} | ${resume.personalInfo.linkedin}`, style: 'subheader' },
      { text: 'Professional Summary', style: 'sectionHeader' },
      { text: resume.personalInfo.summary, style: 'body' },
      { text: 'Experience', style: 'sectionHeader' },
      ...resume.experience.map(exp => [
        { text: `${exp.role} at ${exp.company}`, style: 'bold' },
        { text: `${exp.startDate} - ${exp.endDate}`, style: 'body' },
        { text: exp.description, style: 'body', margin: [0, 0, 0, 10] }
      ]).flat(),
      { text: 'Education', style: 'sectionHeader' },
      ...resume.education.map(edu => [
        { text: `${edu.degree} - ${edu.institution}`, style: 'bold' },
        { text: `${edu.startDate} - ${edu.endDate}`, style: 'body', margin: [0, 0, 0, 10] }
      ]).flat(),
      { text: 'Skills', style: 'sectionHeader' },
      { text: resume.skills.join(', '), style: 'body' }
    ] as any,
    styles: {
      header: { fontSize: 20, bold: true, margin: [0, 0, 0, 5] },
      subheader: { fontSize: 12, margin: [0, 0, 0, 10] },
      sectionHeader: { fontSize: 14, bold: true, margin: [0, 15, 0, 5], decoration: 'underline' },
      bold: { bold: true },
      body: { fontSize: 11, margin: [0, 0, 0, 2] }
    }
  };
  pdfMake.createPdf(docDefinition).download(`${resume.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`);
};

export const generateCoverLetterPdf = (fullName: string, email: string, phone: string, companyName: string, coverLetterText: string) => {
  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: fullName, style: 'header' },
      { text: `${email} | ${phone}`, style: 'subheader' },
      { text: new Date().toLocaleDateString(), style: 'body', margin: [0, 10, 0, 10] },
      { text: companyName, style: 'bold', margin: [0, 0, 0, 10] },
      { text: coverLetterText, style: 'body' }
    ] as any,
    styles: {
      header: { fontSize: 20, bold: true, margin: [0, 0, 0, 5] },
      subheader: { fontSize: 12, margin: [0, 0, 0, 10] },
      bold: { bold: true },
      body: { fontSize: 11, margin: [0, 0, 0, 2] }
    }
  };
  pdfMake.createPdf(docDefinition).download(`${fullName.replace(/\s+/g, '_')}_CoverLetter.pdf`);
};
