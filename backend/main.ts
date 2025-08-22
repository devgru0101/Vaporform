// Vaporform Backend - Main Entry Point for Encore Application
// This file serves as the main entry point and imports all services

// Import health service
import './health/health';

// Import auth service
import './auth/auth';

// Import AI service
import './ai/ai';

// Import projects service
import './projects/projects';

// Import files service
import './files/files';

// Import wizard service (legacy)
import './wizard/wizard';

// Import enhanced wizard service (new 4-step wizard)
import './wizard/wizard-enhanced';

// Import new microservices for comprehensive project wizard
import './projectanalysis/projectanalysis';
import './templates/templates';
import './integrations/integrations';
import './projectgeneration/projectgeneration';

// Import project creation modal service (replaces wizard terminology)
import './projectwizard/projectwizard';