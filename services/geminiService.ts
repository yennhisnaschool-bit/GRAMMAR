
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, FocusArea, QuizType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const quizSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: {
        type: Type.STRING,
        description: 'The quiz question text. For multiple choice, it should include a blank. For transformation, it MUST follow this format: "Original Sentence (KEYWORD) \n \u2192 New Sentence Start _______ New Sentence End (if any)"',
      },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'An array of exactly 4 possible answers for multiple choice. For transformation, this can be empty or null.',
        nullable: true,
      },
      correctAnswerIndex: {
        type: Type.INTEGER,
        description: 'The 0-based index of the correct answer for multiple choice. For transformation, this can be 0 or null.',
        nullable: true,
      },
      modelAnswer: {
        type: Type.STRING,
        description: 'The correct missing 2-5 word phrase for sentence transformation quizzes.',
        nullable: true,
      },
      explanation: {
        type: Type.STRING,
        description: 'A brief explanation of why the answer is correct.',
        nullable: true,
      },
    },
    required: ['question'],
  },
};

export const generateQuiz = async (
  text: string,
  imageParts: { inlineData: { mimeType: string; data: string } }[],
  numQuestions: number,
  focusArea: FocusArea,
  quizType: QuizType
): Promise<QuizQuestion[]> => {
  const model = 'gemini-2.5-flash';
  
  let baseInstruction = '';
  if (quizType === QuizType.MULTIPLE_CHOICE) {
    baseInstruction = `You MUST ONLY generate "fill-in-the-blank" style questions. Each question must be a sentence with a single word or short phrase missing, represented by '_______'. Provide exactly 4 multiple-choice options for the blank.`;
  } else {
    baseInstruction = `You MUST ONLY generate "sentence transformation" style questions. 
For each question:
1. Provide an original sentence followed by a keyword in parentheses (e.g., "She started learning French five years ago. (FOR)").
2. On a new line, provide an arrow "\u2192" followed by the start of a second sentence ending with a blank "_______".
The goal is for the user to complete the second sentence so it means the same as the first using the given keyword.

**STRICT CONSTRAINT:** The text that fills the blank (the answer) MUST be AT LEAST 2 words and AT MOST 5 words long.
Provide the missing 2-5 words in the "modelAnswer" field. Do NOT provide options or an answer index.`;
  }

  let focusSpecificInstruction = '';
  switch (focusArea) {
    case FocusArea.VOCABULARY:
      focusSpecificInstruction = `Test key vocabulary words or synonyms associated with the context.`;
      break;
    case FocusArea.GRAMMAR:
      focusSpecificInstruction = `Analyze the provided context to identify key grammar points and structures (such as specific verb tenses, passive voice, reported speech, conditionals, or relative clauses). Generate exercises that require the user to apply these specific grammatical forms found in the topic content.`;
      break;
    case FocusArea.READING_COMPREHENSION:
      focusSpecificInstruction = `Test facts, details, or inferred meanings from the context.`;
      break;
    case FocusArea.MIXED:
    default:
      focusSpecificInstruction = `Provide a mix of vocabulary, grammar, and detail-oriented questions.`;
      break;
  }
  
  const textPart = {
    text: `Based on the following context, please generate a ${quizType} quiz.

**CRITICAL INSTRUCTIONS:**
${baseInstruction}
${focusSpecificInstruction}

Context: "${text}"

Quiz Requirements:
- Number of questions: ${numQuestions}
- Quiz Type: ${quizType}
- The output must be a valid JSON array of objects, conforming to the provided schema.
- For MULTIPLE_CHOICE: "options" (4 items) and "correctAnswerIndex" are REQUIRED.
- For SENTENCE_TRANSFORMATION: "modelAnswer" is REQUIRED, "options" and "correctAnswerIndex" should be null or omitted.

Generate the quiz now.`
  };

  const contents = {
    parts: [...imageParts, textPart]
  };

  const response = await ai.models.generateContent({
    model: model,
    contents: contents,
    config: {
      responseMimeType: 'application/json',
      responseSchema: quizSchema,
      temperature: 0.5,
    },
  });

  const jsonResponse = response.text;

  try {
    const quizData = JSON.parse(jsonResponse);
    if (!Array.isArray(quizData)) {
      throw new Error("API did not return a valid array.");
    }
    return quizData as QuizQuestion[];
  } catch (error) {
    console.error("Failed to parse Gemini response:", jsonResponse);
    throw new Error("Could not understand the AI's response. Please try again.");
  }
};
