"use client";

import { useAuth } from "@clerk/nextjs";
import { ChevronDown, FileText, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import GenerationOutputItem from "@/components/processing-flow/generation-output-item";
import PhaseCard from "@/components/processing-flow/phase-card";
import { Badge } from "@/components/ui/badge";
import {
  ANIMATION_INTERVAL_MS,
  GENERATION_OUTPUTS,
  PROGRESS_CAP_PERCENTAGE,
} from "@/lib/constants";
import {
  estimateAssemblyAITime,
  formatTimeRange,
} from "@/lib/processing-time-estimator";
import type { PhaseStatus } from "@/lib/types";
import { PLAN_FEATURES, FEATURES, type FeatureName } from "@/lib/tier-config";
import { getMinimumPlanForFeature } from "@/lib/tier-utils";

interface ProcessingFlowProps {
  transcriptionStatus: PhaseStatus;
  generationStatus: PhaseStatus;
  fileDuration?: number;
  createdAt: number;
}

const ProcessingFlow = ({
  transcriptionStatus,
  generationStatus,
  fileDuration,
  createdAt,
}: ProcessingFlowProps) => {
  // Get user's current plan from Clerk
  const { has } = useAuth();

  // Determine user's plan using Clerk's has() method
  const userPlan = useMemo(() => {
    if (has?.({ plan: "ultra" })) return "ultra";
    if (has?.({ plan: "pro" })) return "pro";
    return "free";
  }, [has]);

  const isTranscribing = transcriptionStatus === "running";
  const transcriptionComplete = transcriptionStatus === "completed";
  const transcriptionInProgress =
    transcriptionStatus === "pending" || transcriptionStatus === "running";
  const isGenerating = generationStatus === "running";
  const generationComplete = generationStatus === "completed";

  // Get features available for user's plan
  const availableFeatures = useMemo(() => PLAN_FEATURES[userPlan], [userPlan]);

  // Process all outputs and mark which are locked
  const processedOutputs = useMemo(() => {
    // Map generation outputs to feature keys (properly typed)
    const outputToFeature: Record<string, FeatureName> = {
      Summary: FEATURES.SUMMARY,
      "Key Moments": FEATURES.KEY_MOMENTS,
      "Social Posts": FEATURES.SOCIAL_POSTS,
      Titles: FEATURES.TITLES,
      Hashtags: FEATURES.HASHTAGS,
      "YouTube Timestamps": FEATURES.YOUTUBE_TIMESTAMPS,
    };

    return GENERATION_OUTPUTS.map((output) => {
      const featureKey = outputToFeature[output.name];
      const isLocked = featureKey
        ? !availableFeatures.includes(featureKey)
        : false;
      const requiredPlan = isLocked
        ? getMinimumPlanForFeature(featureKey)
        : null;

      return {
        ...output,
        isLocked,
        requiredPlan,
      };
    });
  }, [availableFeatures]);

  // Only unlocked outputs cycle through animation
  const unlockedOutputs = useMemo(
    () => processedOutputs.filter((o) => !o.isLocked),
    [processedOutputs],
  );

  // Memoize expensive calculations
  const timeEstimate = useMemo(
    () => estimateAssemblyAITime(fileDuration),
    [fileDuration],
  );

  const timeRangeText = useMemo(
    () => formatTimeRange(timeEstimate.bestCase, timeEstimate.conservative),
    [timeEstimate.bestCase, timeEstimate.conservative],
  );

  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [currentOutputIndex, setCurrentOutputIndex] = useState(0);

  useEffect(() => {
    if (!isTranscribing) {
      setTranscriptionProgress(0);
      return;
    }

    const updateProgress = () => {
      const elapsedSeconds = Math.floor((Date.now() - createdAt) / 1000);
      const progress = (elapsedSeconds / timeEstimate.conservative) * 100;
      setTranscriptionProgress(Math.min(PROGRESS_CAP_PERCENTAGE, progress));
    };

    updateProgress();
    const interval = setInterval(updateProgress, 1000);
    return () => clearInterval(interval);
  }, [isTranscribing, createdAt, timeEstimate.conservative]);

  useEffect(() => {
    if (!isGenerating || unlockedOutputs.length === 0) {
      setCurrentOutputIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentOutputIndex((prev) => (prev + 1) % unlockedOutputs.length);
    }, ANIMATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isGenerating, unlockedOutputs.length]);

  const getTranscriptionDescription = useCallback(() => {
    if (isTranscribing) return "AI is analyzing your podcast...";
    if (transcriptionComplete) return "Analysis complete!";
    return "Preparing analysis...";
  }, [isTranscribing, transcriptionComplete]);

  const getGenerationDescription = useCallback(() => {
    if (!transcriptionComplete) return "Waiting for analysis...";
    const unlockedCount = unlockedOutputs.length;
    if (isGenerating)
      return `Generating ${unlockedCount} AI output${unlockedCount !== 1 ? "s" : ""} in parallel...`;
    if (generationComplete) return "All content generated!";
    return "Starting generation...";
  }, [
    transcriptionComplete,
    isGenerating,
    generationComplete,
    unlockedOutputs.length,
  ]);

  return <div>ProcessingFlow</div>;
};
export default ProcessingFlow;
