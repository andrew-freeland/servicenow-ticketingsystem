/**
 * Classification rules for auto-classifying incidents and recommending resources
 * Pure config-driven rules with no external dependencies
 */

export type ResourceType = 'doc' | 'video';

export interface ClassificationResource {
  type: ResourceType;
  label: string;
  url: string;
}

export interface ClassificationRule {
  category: string; // must match the UI category strings
  matchKeywords?: string[]; // case-insensitive keyword matches
  matchErrorCodes?: string[]; // error code patterns to match
  topic: string; // e.g. "HubSpot Lifecycle Issues"
  resources: ClassificationResource[];
}

export const CLASSIFICATION_RULES: ClassificationRule[] = [
  // Google Workspace – Account Access rules
  {
    category: 'Google Workspace – Account Access',
    matchKeywords: ['password', 'login', 'access', 'account', 'locked', 'reset'],
    topic: 'Google Workspace Account Access',
    resources: [
      {
        type: 'doc',
        label: 'Google Workspace Account Access Troubleshooting',
        url: 'https://support.google.com/a/answer/1728857',
      },
      {
        type: 'doc',
        label: 'Reset Google Workspace User Password',
        url: 'https://support.google.com/a/answer/33319',
      },
      {
        type: 'video',
        label: 'Google Workspace Admin Console Walkthrough',
        url: 'https://www.loom.com/share/google-workspace-admin-console',
      },
      {
        type: 'doc',
        label: 'Two-Factor Authentication Setup Guide',
        url: 'https://support.google.com/a/answer/175197',
      },
    ],
  },
  {
    category: 'Google Workspace – Account Access',
    topic: 'General Google Workspace Account Access Support',
    resources: [
      {
        type: 'doc',
        label: 'Google Workspace Admin Help',
        url: 'https://support.google.com/a',
      },
    ],
  },

  // Google Workspace – Groups & Permissions rules
  {
    category: 'Google Workspace – Groups & Permissions',
    matchKeywords: ['group', 'permission', 'share', 'access', 'member'],
    topic: 'Google Workspace Groups & Permissions',
    resources: [
      {
        type: 'doc',
        label: 'Manage Google Groups',
        url: 'https://support.google.com/a/answer/167100',
      },
      {
        type: 'doc',
        label: 'Share Files and Folders in Google Drive',
        url: 'https://support.google.com/drive/answer/7166529',
      },
      {
        type: 'video',
        label: 'Google Workspace Permissions Overview',
        url: 'https://www.loom.com/share/google-workspace-permissions',
      },
    ],
  },
  {
    category: 'Google Workspace – Groups & Permissions',
    topic: 'General Google Workspace Groups & Permissions Support',
    resources: [
      {
        type: 'doc',
        label: 'Google Workspace Admin Help',
        url: 'https://support.google.com/a',
      },
    ],
  },

  // HubSpot – Lifecycle & Automation rules
  {
    category: 'HubSpot – Lifecycle & Automation',
    matchKeywords: ['lifecycle', 'workflow', 'automation', 'deal stage', 'pipeline', 'enrollment'],
    matchErrorCodes: ['WF-', 'HS-WF'],
    topic: 'HubSpot Lifecycle & Automation',
    resources: [
      {
        type: 'doc',
        label: 'HubSpot Lifecycle Playbook',
        url: 'https://docs.example.com/hubspot-lifecycle-playbook',
      },
      {
        type: 'video',
        label: 'HubSpot Workflow Debug Walkthrough',
        url: 'https://www.loom.com/share/hubspot-workflow-debug',
      },
      {
        type: 'doc',
        label: 'HubSpot Automation Best Practices',
        url: 'https://docs.example.com/hubspot-automation-best-practices',
      },
    ],
  },
  {
    category: 'HubSpot – Lifecycle & Automation',
    topic: 'General HubSpot Lifecycle & Automation Support',
    resources: [
      {
        type: 'doc',
        label: 'HubSpot Lifecycle & Automation Documentation',
        url: 'https://docs.example.com/hubspot-lifecycle-automation',
      },
    ],
  },

  // HubSpot – Email Deliverability rules
  {
    category: 'HubSpot – Email Deliverability',
    matchKeywords: ['bounce', 'delivery', 'spam', 'dkim', 'spf', 'email', 'send'],
    matchErrorCodes: ['Bounce', '5.1.0', '5.7.1'],
    topic: 'HubSpot Email Deliverability',
    resources: [
      {
        type: 'doc',
        label: 'HubSpot Email Deliverability Guide',
        url: 'https://docs.example.com/hubspot-email-deliverability',
      },
      {
        type: 'doc',
        label: 'SPF and DKIM Configuration for HubSpot',
        url: 'https://docs.example.com/hubspot-spf-dkim',
      },
      {
        type: 'video',
        label: 'Troubleshooting Email Bounces',
        url: 'https://www.loom.com/share/hubspot-email-bounces',
      },
    ],
  },
  {
    category: 'HubSpot – Email Deliverability',
    topic: 'General HubSpot Email Deliverability Support',
    resources: [
      {
        type: 'doc',
        label: 'HubSpot Email Deliverability Documentation',
        url: 'https://docs.example.com/hubspot-email-deliverability-docs',
      },
    ],
  },

  // Buildertrend – Estimates & Proposals rules
  {
    category: 'Buildertrend – Estimates & Proposals',
    matchKeywords: ['estimate', 'proposal', 'quote', 'bid', 'pricing'],
    topic: 'Buildertrend Estimates & Proposals',
    resources: [
      {
        type: 'doc',
        label: 'Buildertrend Estimates Guide',
        url: 'https://docs.example.com/buildertrend-estimates',
      },
      {
        type: 'video',
        label: 'Creating Proposals in Buildertrend',
        url: 'https://www.loom.com/share/buildertrend-proposals',
      },
      {
        type: 'doc',
        label: 'Buildertrend Pricing Best Practices',
        url: 'https://docs.example.com/buildertrend-pricing',
      },
    ],
  },
  {
    category: 'Buildertrend – Estimates & Proposals',
    topic: 'General Buildertrend Estimates & Proposals Support',
    resources: [
      {
        type: 'doc',
        label: 'Buildertrend Estimates & Proposals Documentation',
        url: 'https://docs.example.com/buildertrend-estimates-docs',
      },
    ],
  },

  // Buildertrend – Daily Logs & Timecards rules
  {
    category: 'Buildertrend – Daily Logs & Timecards',
    matchKeywords: ['log', 'timecard', 'time', 'hours', 'attendance', 'daily'],
    topic: 'Buildertrend Daily Logs & Timecards',
    resources: [
      {
        type: 'doc',
        label: 'Buildertrend Daily Logs Guide',
        url: 'https://docs.example.com/buildertrend-daily-logs',
      },
      {
        type: 'video',
        label: 'Timecard Management in Buildertrend',
        url: 'https://www.loom.com/share/buildertrend-timecards',
      },
      {
        type: 'doc',
        label: 'Buildertrend Time Tracking Best Practices',
        url: 'https://docs.example.com/buildertrend-time-tracking',
      },
    ],
  },
  {
    category: 'Buildertrend – Daily Logs & Timecards',
    topic: 'General Buildertrend Daily Logs & Timecards Support',
    resources: [
      {
        type: 'doc',
        label: 'Buildertrend Daily Logs & Timecards Documentation',
        url: 'https://docs.example.com/buildertrend-logs-timecards-docs',
      },
    ],
  },

  // Apple Business Essentials – Device Enrollment rules
  {
    category: 'Apple Business Essentials – Device Enrollment',
    matchKeywords: ['iphone', 'ipad', 'device', 'enrollment', 'mdm', 'enroll'],
    topic: 'Apple Business Essentials Device Enrollment',
    resources: [
      {
        type: 'doc',
        label: 'Apple Business Essentials Device Enrollment',
        url: 'https://docs.example.com/apple-device-enrollment',
      },
      {
        type: 'video',
        label: 'MDM Configuration Walkthrough',
        url: 'https://www.loom.com/share/apple-mdm-config',
      },
      {
        type: 'doc',
        label: 'Device Enrollment Troubleshooting',
        url: 'https://docs.example.com/apple-enrollment-troubleshooting',
      },
    ],
  },
  {
    category: 'Apple Business Essentials – Device Enrollment',
    topic: 'General Apple Business Essentials Device Enrollment Support',
    resources: [
      {
        type: 'doc',
        label: 'Apple Business Essentials Device Enrollment Documentation',
        url: 'https://docs.example.com/apple-device-enrollment-docs',
      },
    ],
  },

  // Website – DNS & Email Routing rules
  {
    category: 'Website – DNS & Email Routing',
    matchKeywords: ['dns', 'domain', 'mx', 'spf', 'dkim', 'email routing', 'nameserver'],
    topic: 'Website DNS & Email Routing',
    resources: [
      {
        type: 'doc',
        label: 'DNS Configuration Guide',
        url: 'https://docs.example.com/dns-configuration',
      },
      {
        type: 'doc',
        label: 'Email Routing Setup',
        url: 'https://docs.example.com/email-routing-setup',
      },
      {
        type: 'video',
        label: 'DNS Record Management Tutorial',
        url: 'https://www.loom.com/share/dns-management',
      },
    ],
  },
  {
    category: 'Website – DNS & Email Routing',
    topic: 'General Website DNS & Email Routing Support',
    resources: [
      {
        type: 'doc',
        label: 'Website DNS & Email Routing Documentation',
        url: 'https://docs.example.com/website-dns-email-docs',
      },
    ],
  },

  // Website – Content & Layout rules
  {
    category: 'Website – Content & Layout',
    matchKeywords: ['layout', 'design', 'css', 'styling', 'responsive', 'content', 'page'],
    topic: 'Website Content & Layout',
    resources: [
      {
        type: 'doc',
        label: 'Website Design Guidelines',
        url: 'https://docs.example.com/website-design-guidelines',
      },
      {
        type: 'video',
        label: 'Responsive Design Best Practices',
        url: 'https://www.loom.com/share/responsive-design',
      },
      {
        type: 'doc',
        label: 'Content Management Best Practices',
        url: 'https://docs.example.com/content-management',
      },
    ],
  },
  {
    category: 'Website – Content & Layout',
    topic: 'General Website Content & Layout Support',
    resources: [
      {
        type: 'doc',
        label: 'Website Content & Layout Documentation',
        url: 'https://docs.example.com/website-content-layout-docs',
      },
    ],
  },

  // Integrations – Automation / Zapier / Make rules
  {
    category: 'Integrations – Automation / Zapier / Make',
    matchKeywords: ['zapier', 'make', 'automation', 'workflow', 'trigger', 'action'],
    topic: 'Integrations Automation (Zapier / Make)',
    resources: [
      {
        type: 'doc',
        label: 'Zapier Integration Guide',
        url: 'https://docs.example.com/zapier-integration',
      },
      {
        type: 'doc',
        label: 'Make (Integromat) Automation Guide',
        url: 'https://docs.example.com/make-automation',
      },
      {
        type: 'video',
        label: 'Building Automation Workflows',
        url: 'https://www.loom.com/share/automation-workflows',
      },
    ],
  },
  {
    category: 'Integrations – Automation / Zapier / Make',
    matchKeywords: ['api', 'webhook', 'sync', 'connection', 'integration'],
    topic: 'Integration Setup & Configuration',
    resources: [
      {
        type: 'doc',
        label: 'Integration Setup Guide',
        url: 'https://docs.example.com/integration-setup',
      },
      {
        type: 'video',
        label: 'Webhook Configuration Tutorial',
        url: 'https://www.loom.com/share/webhook-config',
      },
    ],
  },
  {
    category: 'Integrations – Automation / Zapier / Make',
    matchKeywords: ['error', 'failed', 'timeout', 'authentication'],
    topic: 'Integration Errors',
    resources: [
      {
        type: 'doc',
        label: 'Integration Error Troubleshooting',
        url: 'https://docs.example.com/integration-errors',
      },
    ],
  },
  {
    category: 'Integrations – Automation / Zapier / Make',
    topic: 'General Integration Automation Support',
    resources: [
      {
        type: 'doc',
        label: 'Integration Automation Documentation',
        url: 'https://docs.example.com/integration-automation-docs',
      },
    ],
  },

  // Other category (generic fallback)
  {
    category: 'Other',
    topic: 'General Support',
    resources: [
      {
        type: 'doc',
        label: 'General Support Documentation',
        url: 'https://docs.example.com/general-support',
      },
    ],
  },
];


