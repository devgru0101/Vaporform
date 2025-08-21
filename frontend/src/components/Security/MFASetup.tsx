import React, { useState } from 'react';

interface MFASetupProps {
  onComplete?: (success: boolean) => void;
}

const MFASetup: React.FC<MFASetupProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');

  const handleVerification = () => {
    // Mock verification
    if (verificationCode.length === 6) {
      onComplete?.(true);
    }
  };

  return (
    <div data-testid="mfa-setup">
      <h2>Multi-Factor Authentication Setup</h2>
      
      {step === 1 && (
        <div data-testid="mfa-step-1">
          <p>Scan the QR code with your authenticator app:</p>
          <div data-testid="qr-code">
            <canvas width="200" height="200" />
          </div>
          <button 
            onClick={() => setStep(2)}
            data-testid="continue-button"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div data-testid="mfa-step-2">
          <p>Enter the verification code from your authenticator app:</p>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            data-testid="verification-input"
            maxLength={6}
          />
          <button 
            onClick={handleVerification}
            data-testid="verify-button"
            disabled={verificationCode.length !== 6}
          >
            Verify
          </button>
        </div>
      )}
    </div>
  );
};

export default MFASetup;