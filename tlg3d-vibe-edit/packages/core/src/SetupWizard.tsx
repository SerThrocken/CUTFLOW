// ===== MAIN SETUP WIZARD COMPONENT =====

import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Alert, Progress, Badge, Modal } from '@tlg3d/core/ui-components';
import {
  INITIAL_WIZARD_STATE,
  WIZARD_STEPS,
  validateStep,
  type SetupWizardState,
} from '@tlg3d/core/setup-wizard-types';
import SystemDetector, { type SystemInfo } from '@tlg3d/core/system-detector';
import WelcomeStep from './wizard-steps/WelcomeStep';
import SystemDetectionStep from './wizard-steps/SystemDetectionStep';
import MessagingStep from './wizard-steps/MessagingStep';
import ModelSelectionStep from './wizard-steps/ModelSelectionStep';
import AnimationPreferencesStep from './wizard-steps/AnimationPreferencesStep';
import EditingPreferencesStep from './wizard-steps/EditingPreferencesStep';
import AgenticFeaturesStep from './wizard-steps/AgenticFeaturesStep';
import ThemePersonalizationStep from './wizard-steps/ThemePersonalizationStep';

interface SetupWizardProps {
  onComplete?: (config: SetupWizardState) => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [state, setState] = useState<SetupWizardState>(INITIAL_WIZARD_STATE);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showSkipWarning, setShowSkipWarning] = useState(false);

  useEffect(() => {
    // Detect system on load
    detectSystem();
  }, []);

  const detectSystem = async () => {
    setIsLoading(true);
    try {
      const system = await SystemDetector.detectSystem();
      setSystemInfo(system);
    } catch (error) {
      console.error('System detection failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    // Validate current step
    const validation = validateStep(state.currentStep, state);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);

    if (state.currentStep < state.totalSteps) {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    } else {
      completeSetup();
    }
  };

  const handlePreviousStep = () => {
    if (state.currentStep > 1) {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
      setValidationErrors([]);
    }
  };

  const handleSkipStep = () => {
    if (state.currentStep === state.totalSteps) {
      completeSetup();
    } else {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
      setValidationErrors([]);
    }
  };

  const completeSetup = async () => {
    setIsLoading(true);
    try {
      // Save config to backend
      await fetch('/api/setup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });

      setState(prev => ({ ...prev, completed: true }));
      onComplete?.(state);
    } catch (error) {
      console.error('Setup save failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentStep = WIZARD_STEPS[state.currentStep - 1];
  const progress = (state.currentStep / state.totalSteps) * 100;

  const renderStepContent = () => {
    switch (state.currentStep) {
      case 1:
        return <WelcomeStep state={state} setState={setState} systemInfo={systemInfo} />;
      case 2:
        return <SystemDetectionStep state={state} setState={setState} systemInfo={systemInfo} />;
      case 3:
        return <MessagingStep state={state} setState={setState} />;
      case 4:
        return <ModelSelectionStep state={state} setState={setState} systemInfo={systemInfo} />;
      case 5:
        return <AnimationPreferencesStep state={state} setState={setState} />;
      case 6:
        return <EditingPreferencesStep state={state} setState={setState} />;
      case 7:
        return <AgenticFeaturesStep state={state} setState={setState} />;
      case 8:
        return <ThemePersonalizationStep state={state} setState={setState} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-3 bg-gradient-to-br from-green-600 to-green-700 rounded-lg mb-4">
            <span className="text-4xl">{currentStep.icon}</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-100 mb-2">{currentStep.title}</h1>
          <p className="text-gray-400">{currentStep.description}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>
              Step {state.currentStep} of {state.totalSteps}
            </span>
            <span>~{currentStep.estimated}</span>
          </div>
          <Progress value={progress} max={100} showLabel={false} variant="primary" />
        </div>

        {/* Step Indicators */}
        <div className="mb-8 grid grid-cols-8 gap-2">
          {WIZARD_STEPS.map(step => (
            <div
              key={step.id}
              className={`h-2 rounded-full transition-colors ${
                step.id <= state.currentStep ? 'bg-green-600' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Warnings */}
        {systemInfo && SystemDetector.getWarnings(systemInfo).length > 0 && (
          <div className="mb-6 space-y-2">
            {SystemDetector.getWarnings(systemInfo).map((warning, i) => (
              <Alert key={i} type="warning" icon="⚠️" dismissible>
                {warning}
              </Alert>
            ))}
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6 space-y-2">
            {validationErrors.map((error, i) => (
              <Alert key={i} type="error" icon="❌" dismissible>
                {error}
              </Alert>
            ))}
          </div>
        )}

        {/* Step Content */}
        <Card className="mb-8 min-h-96">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-gray-700 border-t-green-600 rounded-full mx-auto mb-4" />
                <p className="text-gray-400">Setting up your system...</p>
              </div>
            </div>
          ) : (
            renderStepContent()
          )}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            onClick={handlePreviousStep}
            variant="ghost"
            disabled={state.currentStep === 1}
          >
            ← Back
          </Button>

          <div className="flex gap-3">
            {state.currentStep < state.totalSteps && (
              <Button
                onClick={() => setShowSkipWarning(true)}
                variant="ghost"
              >
                Skip
              </Button>
            )}

            <Button
              onClick={handleNextStep}
              variant="primary"
              disabled={isLoading}
            >
              {state.currentStep === state.totalSteps
                ? `✓ Complete Setup`
                : `Next →`}
            </Button>
          </div>
        </div>

        {/* Skip Warning Modal */}
        <Modal isOpen={showSkipWarning} onClose={() => setShowSkipWarning(false)} title="Skip This Step?">
          <div className="space-y-4">
            <p className="text-gray-300">
              You can configure this later in Settings. Continue?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowSkipWarning(false)}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowSkipWarning(false);
                  handleSkipStep();
                }}
                variant="primary"
              >
                Skip
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default SetupWizard;
