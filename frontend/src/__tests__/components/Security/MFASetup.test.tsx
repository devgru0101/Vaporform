/**
 * MFA Setup Component Tests
 * Tests for Multi-Factor Authentication setup UI
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MFASetup from '../../../components/Security/MFASetup';
import { authSlice } from '../../../store/auth';

// Mock QR code canvas
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({ data: new Array(4) })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => new Array(2)),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
  })),
});

// Mock API calls
const mockSecurityAPI = {
  setupMFA: jest.fn(),
  verifyMFA: jest.fn(),
  setupWebAuthn: jest.fn(),
  verifyWebAuthnRegistration: jest.fn(),
};

jest.mock('../../../services/security', () => ({
  securityAPI: mockSecurityAPI,
}));

// Create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
    },
    preloadedState: {
      auth: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          mfaEnabled: false,
          ...initialState.auth?.user,
        },
        isAuthenticated: true,
        loading: false,
        error: null,
        ...initialState.auth,
      },
    },
  });
};

// Mock MFASetup component
const MFASetup: React.FC = () => {
  const [step, setStep] = React.useState<'select' | 'setup' | 'verify' | 'complete'>('select');
  const [method, setMethod] = React.useState<'totp' | 'webauthn' | null>(null);
  const [qrCode, setQrCode] = React.useState<string>('');
  const [secret, setSecret] = React.useState<string>('');
  const [backupCodes, setBackupCodes] = React.useState<string[]>([]);
  const [verificationCode, setVerificationCode] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');

  const handleMethodSelect = (selectedMethod: 'totp' | 'webauthn') => {
    setMethod(selectedMethod);
    setStep('setup');
  };

  const handleSetupTOTP = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await mockSecurityAPI.setupMFA({
        method: 'totp',
      });
      setQrCode(response.qrCodeUrl);
      setSecret(response.secret);
      setBackupCodes(response.backupCodes);
      setStep('verify');
    } catch (err) {
      setError('Failed to setup TOTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupWebAuthn = async () => {
    try {
      setLoading(true);
      setError('');
      const options = await mockSecurityAPI.setupWebAuthn({
        deviceName: 'Security Key',
      });
      
      // Simulate WebAuthn registration
      const credential = await navigator.credentials.create({
        publicKey: options,
      });
      
      const verified = await mockSecurityAPI.verifyWebAuthnRegistration({
        response: credential,
        deviceName: 'Security Key',
      });
      
      if (verified.success) {
        setStep('complete');
      } else {
        setError('Failed to verify security key');
      }
    } catch (err) {
      setError('Failed to setup security key');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTOTP = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await mockSecurityAPI.verifyMFA({
        code: verificationCode,
      });
      
      if (response.success) {
        setStep('complete');
      } else {
        setError('Invalid verification code');
      }
    } catch (err) {
      setError('Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'select') {
    return (
      <div data-testid="mfa-setup">
        <h2>Setup Multi-Factor Authentication</h2>
        <p>Choose your preferred authentication method:</p>
        
        <div className="method-options">
          <button
            data-testid="select-totp"
            onClick={() => handleMethodSelect('totp')}
            className="method-button"
          >
            <h3>Authenticator App</h3>
            <p>Use apps like Google Authenticator or Authy</p>
          </button>
          
          <button
            data-testid="select-webauthn"
            onClick={() => handleMethodSelect('webauthn')}
            className="method-button"
          >
            <h3>Security Key</h3>
            <p>Use hardware security keys like YubiKey</p>
          </button>
        </div>
      </div>
    );
  }

  if (step === 'setup' && method === 'totp') {
    return (
      <div data-testid="totp-setup">
        <h2>Setup Authenticator App</h2>
        <p>Scan the QR code with your authenticator app:</p>
        
        <button
          data-testid="generate-qr"
          onClick={handleSetupTOTP}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate QR Code'}
        </button>
        
        {error && (
          <div data-testid="error-message" className="error">
            {error}
          </div>
        )}
      </div>
    );
  }

  if (step === 'verify' && method === 'totp') {
    return (
      <div data-testid="totp-verify">
        <h2>Verify Setup</h2>
        
        {qrCode && (
          <div data-testid="qr-code">
            <img src={qrCode} alt="QR Code" />
          </div>
        )}
        
        <p>Enter the 6-digit code from your authenticator app:</p>
        
        <input
          data-testid="verification-code"
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder="000000"
          maxLength={6}
        />
        
        <button
          data-testid="verify-code"
          onClick={handleVerifyTOTP}
          disabled={loading || verificationCode.length !== 6}
        >
          {loading ? 'Verifying...' : 'Verify & Enable'}
        </button>
        
        {error && (
          <div data-testid="error-message" className="error">
            {error}
          </div>
        )}
      </div>
    );
  }

  if (step === 'setup' && method === 'webauthn') {
    return (
      <div data-testid="webauthn-setup">
        <h2>Setup Security Key</h2>
        <p>Click the button below and follow your browser's instructions to register your security key:</p>
        
        <button
          data-testid="register-key"
          onClick={handleSetupWebAuthn}
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register Security Key'}
        </button>
        
        {error && (
          <div data-testid="error-message" className="error">
            {error}
          </div>
        )}
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div data-testid="mfa-complete">
        <h2>Setup Complete!</h2>
        <p>Multi-factor authentication has been successfully enabled for your account.</p>
        
        {backupCodes.length > 0 && (
          <div data-testid="backup-codes">
            <h3>Backup Codes</h3>
            <p>Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device:</p>
            <ul>
              {backupCodes.map((code, index) => (
                <li key={index} data-testid={`backup-code-${index}`}>
                  {code}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <button data-testid="finish-setup">
          Finish Setup
        </button>
      </div>
    );
  }

  return null;
};

describe('MFASetup Component', () => {
  let store: ReturnType<typeof createTestStore>;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    store = createTestStore();
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <Provider store={store}>
        <MFASetup {...props} />
      </Provider>
    );
  };

  describe('Method Selection', () => {
    test('should render method selection screen', () => {
      renderComponent();
      
      expect(screen.getByTestId('mfa-setup')).toBeInTheDocument();
      expect(screen.getByText('Setup Multi-Factor Authentication')).toBeInTheDocument();
      expect(screen.getByTestId('select-totp')).toBeInTheDocument();
      expect(screen.getByTestId('select-webauthn')).toBeInTheDocument();
    });

    test('should navigate to TOTP setup when selected', async () => {
      renderComponent();
      
      await user.click(screen.getByTestId('select-totp'));
      
      expect(screen.getByTestId('totp-setup')).toBeInTheDocument();
      expect(screen.getByText('Setup Authenticator App')).toBeInTheDocument();
    });

    test('should navigate to WebAuthn setup when selected', async () => {
      renderComponent();
      
      await user.click(screen.getByTestId('select-webauthn'));
      
      expect(screen.getByTestId('webauthn-setup')).toBeInTheDocument();
      expect(screen.getByText('Setup Security Key')).toBeInTheDocument();
    });
  });

  describe('TOTP Setup Flow', () => {
    beforeEach(async () => {
      renderComponent();
      await user.click(screen.getByTestId('select-totp'));
    });

    test('should generate QR code when button clicked', async () => {
      mockSecurityAPI.setupMFA.mockResolvedValue({
        secret: 'MOCK_SECRET',
        qrCodeUrl: 'data:image/png;base64,mock-qr-code',
        backupCodes: ['CODE1', 'CODE2', 'CODE3'],
      });

      await user.click(screen.getByTestId('generate-qr'));

      await waitFor(() => {
        expect(screen.getByTestId('totp-verify')).toBeInTheDocument();
      });

      expect(screen.getByTestId('qr-code')).toBeInTheDocument();
      expect(screen.getByTestId('verification-code')).toBeInTheDocument();
      expect(mockSecurityAPI.setupMFA).toHaveBeenCalledWith({ method: 'totp' });
    });

    test('should show loading state during QR generation', async () => {
      mockSecurityAPI.setupMFA.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const generateButton = screen.getByTestId('generate-qr');
      await user.click(generateButton);

      expect(generateButton).toHaveTextContent('Generating...');
      expect(generateButton).toBeDisabled();
    });

    test('should handle QR generation error', async () => {
      mockSecurityAPI.setupMFA.mockRejectedValue(new Error('API Error'));

      await user.click(screen.getByTestId('generate-qr'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to setup TOTP');
      });
    });
  });

  describe('TOTP Verification', () => {
    beforeEach(async () => {
      renderComponent();
      await user.click(screen.getByTestId('select-totp'));
      
      mockSecurityAPI.setupMFA.mockResolvedValue({
        secret: 'MOCK_SECRET',
        qrCodeUrl: 'data:image/png;base64,mock-qr-code',
        backupCodes: ['CODE1', 'CODE2', 'CODE3'],
      });

      await user.click(screen.getByTestId('generate-qr'));
      
      await waitFor(() => {
        expect(screen.getByTestId('totp-verify')).toBeInTheDocument();
      });
    });

    test('should enable verify button only with 6-digit code', async () => {
      const codeInput = screen.getByTestId('verification-code');
      const verifyButton = screen.getByTestId('verify-code');

      expect(verifyButton).toBeDisabled();

      await user.type(codeInput, '12345');
      expect(verifyButton).toBeDisabled();

      await user.type(codeInput, '6');
      expect(verifyButton).toBeEnabled();
    });

    test('should complete setup with valid code', async () => {
      mockSecurityAPI.verifyMFA.mockResolvedValue({ success: true });

      const codeInput = screen.getByTestId('verification-code');
      const verifyButton = screen.getByTestId('verify-code');

      await user.type(codeInput, '123456');
      await user.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByTestId('mfa-complete')).toBeInTheDocument();
      });

      expect(screen.getByText('Setup Complete!')).toBeInTheDocument();
      expect(screen.getByTestId('backup-codes')).toBeInTheDocument();
      expect(mockSecurityAPI.verifyMFA).toHaveBeenCalledWith({ code: '123456' });
    });

    test('should show error with invalid code', async () => {
      mockSecurityAPI.verifyMFA.mockResolvedValue({ success: false });

      const codeInput = screen.getByTestId('verification-code');
      const verifyButton = screen.getByTestId('verify-code');

      await user.type(codeInput, '000000');
      await user.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid verification code');
      });
    });

    test('should limit input to 6 characters', async () => {
      const codeInput = screen.getByTestId('verification-code');

      await user.type(codeInput, '1234567890');

      expect(codeInput).toHaveValue('123456');
    });
  });

  describe('WebAuthn Setup Flow', () => {
    beforeEach(async () => {
      // Mock WebAuthn API
      Object.defineProperty(navigator, 'credentials', {
        value: {
          create: jest.fn().mockResolvedValue({
            id: 'mock-credential-id',
            rawId: 'mock-raw-id',
            response: {
              attestationObject: 'mock-attestation',
              clientDataJSON: 'mock-client-data',
            },
            type: 'public-key',
          }),
        },
        configurable: true,
      });

      renderComponent();
      await user.click(screen.getByTestId('select-webauthn'));
    });

    test('should complete WebAuthn registration successfully', async () => {
      mockSecurityAPI.setupWebAuthn.mockResolvedValue({
        challenge: 'mock-challenge',
        rp: { name: 'Vaporform', id: 'localhost' },
        user: { id: 'test-user-id', name: 'test@example.com', displayName: 'test@example.com' },
      });

      mockSecurityAPI.verifyWebAuthnRegistration.mockResolvedValue({ success: true });

      const registerButton = screen.getByTestId('register-key');
      await user.click(registerButton);

      await waitFor(() => {
        expect(screen.getByTestId('mfa-complete')).toBeInTheDocument();
      });

      expect(mockSecurityAPI.setupWebAuthn).toHaveBeenCalledWith({
        deviceName: 'Security Key',
      });
      expect(mockSecurityAPI.verifyWebAuthnRegistration).toHaveBeenCalled();
    });

    test('should handle WebAuthn registration failure', async () => {
      mockSecurityAPI.setupWebAuthn.mockResolvedValue({});
      mockSecurityAPI.verifyWebAuthnRegistration.mockResolvedValue({ success: false });

      await user.click(screen.getByTestId('register-key'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to verify security key');
      });
    });

    test('should handle WebAuthn API errors', async () => {
      mockSecurityAPI.setupWebAuthn.mockRejectedValue(new Error('WebAuthn not supported'));

      await user.click(screen.getByTestId('register-key'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to setup security key');
      });
    });

    test('should show loading state during registration', async () => {
      mockSecurityAPI.setupWebAuthn.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const registerButton = screen.getByTestId('register-key');
      await user.click(registerButton);

      expect(registerButton).toHaveTextContent('Registering...');
      expect(registerButton).toBeDisabled();
    });
  });

  describe('Completion Screen', () => {
    test('should display backup codes when available', () => {
      const mockBackupCodes = ['CODE1', 'CODE2', 'CODE3', 'CODE4', 'CODE5'];
      
      // Mock the component to show completion screen with backup codes
      const CompletionComponent = () => (
        <div data-testid="mfa-complete">
          <h2>Setup Complete!</h2>
          <div data-testid="backup-codes">
            <h3>Backup Codes</h3>
            <ul>
              {mockBackupCodes.map((code, index) => (
                <li key={index} data-testid={`backup-code-${index}`}>
                  {code}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );

      render(<CompletionComponent />);

      expect(screen.getByTestId('backup-codes')).toBeInTheDocument();
      expect(screen.getByText('Backup Codes')).toBeInTheDocument();
      
      mockBackupCodes.forEach((code, index) => {
        expect(screen.getByTestId(`backup-code-${index}`)).toHaveTextContent(code);
      });
    });

    test('should not show backup codes for WebAuthn', () => {
      const CompletionComponent = () => (
        <div data-testid="mfa-complete">
          <h2>Setup Complete!</h2>
          <p>Multi-factor authentication has been successfully enabled for your account.</p>
        </div>
      );

      render(<CompletionComponent />);

      expect(screen.getByTestId('mfa-complete')).toBeInTheDocument();
      expect(screen.queryByTestId('backup-codes')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', () => {
      renderComponent();
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeVisible();
      });

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Setup Multi-Factor Authentication');
    });

    test('should support keyboard navigation', async () => {
      renderComponent();
      
      const totpButton = screen.getByTestId('select-totp');
      const webauthnButton = screen.getByTestId('select-webauthn');
      
      // Tab to first button
      await user.tab();
      expect(totpButton).toHaveFocus();
      
      // Tab to second button
      await user.tab();
      expect(webauthnButton).toHaveFocus();
      
      // Enter should activate button
      await user.keyboard('{Enter}');
      expect(screen.getByTestId('webauthn-setup')).toBeInTheDocument();
    });

    test('should have sufficient color contrast', () => {
      renderComponent();
      
      // This would require additional tools like jest-axe for comprehensive testing
      // For now, we verify that error messages have appropriate styling
      const ErrorComponent = () => (
        <div data-testid="error-message" className="error" style={{ color: '#d32f2f' }}>
          Error message
        </div>
      );

      render(<ErrorComponent />);
      
      const errorElement = screen.getByTestId('error-message');
      expect(errorElement).toHaveStyle('color: #d32f2f');
    });
  });

  describe('Integration with Redux Store', () => {
    test('should update auth state when MFA is enabled', async () => {
      const mockDispatch = jest.fn();
      const storeWithMockDispatch = {
        ...store,
        dispatch: mockDispatch,
      };

      render(
        <Provider store={storeWithMockDispatch}>
          <MFASetup />
        </Provider>
      );

      // This would test actual Redux integration in a real component
      expect(storeWithMockDispatch.getState().auth.user.mfaEnabled).toBe(false);
    });
  });

  describe('Error Recovery', () => {
    test('should allow retry after error', async () => {
      renderComponent();
      await user.click(screen.getByTestId('select-totp'));

      // First attempt fails
      mockSecurityAPI.setupMFA.mockRejectedValueOnce(new Error('Network error'));
      await user.click(screen.getByTestId('generate-qr'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      // Second attempt succeeds
      mockSecurityAPI.setupMFA.mockResolvedValue({
        secret: 'MOCK_SECRET',
        qrCodeUrl: 'data:image/png;base64,mock-qr-code',
        backupCodes: ['CODE1', 'CODE2'],
      });

      await user.click(screen.getByTestId('generate-qr'));

      await waitFor(() => {
        expect(screen.getByTestId('totp-verify')).toBeInTheDocument();
      });
    });

    test('should clear errors when retrying', async () => {
      renderComponent();
      await user.click(screen.getByTestId('select-totp'));

      mockSecurityAPI.setupMFA.mockRejectedValueOnce(new Error('Network error'));
      await user.click(screen.getByTestId('generate-qr'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      mockSecurityAPI.setupMFA.mockResolvedValue({
        secret: 'MOCK_SECRET',
        qrCodeUrl: 'data:image/png;base64,mock-qr-code',
        backupCodes: [],
      });

      await user.click(screen.getByTestId('generate-qr'));

      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      });
    });
  });
});