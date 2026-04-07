
export interface ICD10Model {
  code: string;
  name: string;
  coefficients: { [facet: string]: number };
  description: string;
}

export const icd10Models: ICD10Model[] = [
  {
    code: "F60.0",
    name: "Paranoid Personality Disorder",
    coefficients: {
      "Suspiciousness": 5.60,
      "Perceptual Dysregulation": -4.42
    },
    description: "Pervasive distrust and suspicion."
  },
  {
    code: "F60.1",
    name: "Schizoid Personality Disorder",
    coefficients: {
      "Anhedonia": 2.36,
      "Intimacy Avoidance": 1.87,
      "Anxiousness": -4.46
    },
    description: "Detachment from social relationships."
  },
  {
    code: "F60.2",
    name: "Antisocial Personality Disorder",
    coefficients: {
      "Irresponsibility": 3.11,
      "Deceitfulness": 0.92,
      "Callousness": 1.03
    },
    description: "Disregard for and violation of the rights of others."
  },
  {
    code: "F60.3",
    name: "Borderline Personality Disorder",
    coefficients: {
      "Impulsivity": 5.69,
      "Emotional Lability": 2.44,
      "Depressivity": 1.50, // Estimated from primary facets as PDF was cut off
      "Separation Insecurity": 1.20 // Estimated from primary facets as PDF was cut off
    },
    description: "Instability in emotions, relationships, and self-image."
  },
  {
    code: "F60.4",
    name: "Histrionic Personality Disorder",
    coefficients: {
      "Attention Seeking": 3.09,
      "Emotional Lability": 1.41
    },
    description: "Excessive emotionality and attention-seeking."
  },
  {
    code: "F60.5",
    name: "Anankastic (OCPD) Personality Disorder",
    coefficients: {
      "Rigid Perfectionism": 4.87,
      "Perseveration": 1.67
    },
    description: "Preoccupation with orderliness and control."
  },
  {
    code: "F60.6",
    name: "Avoidant Personality Disorder",
    coefficients: {
      "Withdrawal": 3.72,
      "Intimacy Avoidance": 3.28,
      "Restricted Affectivity": -5.39
    },
    description: "Social inhibition and feelings of inadequacy."
  },
  {
    code: "F60.7",
    name: "Dependent Personality Disorder",
    coefficients: {
      "Submissiveness": 3.90,
      "Separation Insecurity": 1.55
    },
    description: "Excessive need to be taken care of."
  },
  {
    code: "F60.81",
    name: "Narcissistic Personality Disorder",
    coefficients: {
      "Grandiosity": 2.52,
      "Callousness": 4.50,
      "Impulsivity": -5.21
    },
    description: "Grandiosity and lack of empathy."
  },
  {
    code: "F21",
    name: "Schizotypal Disorder",
    coefficients: {
      "Eccentricity": 5.80,
      "Suspiciousness": 0.86
    },
    description: "Acute discomfort in close relationships, cognitive or perceptual distortions."
  }
];
