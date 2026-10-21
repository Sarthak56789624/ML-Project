import React from "react";
import { Assessment } from "./Assessment";

/**
 * DiabetesAssessment component now delegates directly to the unified Cardiometabolic Assessment,
 * eliminating redundant duplicate data entries across Hypertension and Diabetes screens.
 */
export const DiabetesAssessment: React.FC = () => {
  return <Assessment />;
};

export default DiabetesAssessment;
