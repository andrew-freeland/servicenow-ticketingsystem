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
  // HubSpot / CRM rules
  {
    category: 'HubSpot / CRM',
    matchKeywords: ['lifecycle', 'workflow', 'automation', 'deal stage', 'pipeline'],
    matchErrorCodes: ['WF-', 'HS-WF'],
    topic: 'HubSpot Lifecycle Issues',
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
    ],
  },
  {
    category: 'HubSpot / CRM',
    matchKeywords: ['contact', 'company', 'property', 'field', 'custom property'],
    topic: 'HubSpot Data Management',
    resources: [
      {
        type: 'doc',
        label: 'HubSpot Custom Properties Guide',
        url: 'https://docs.example.com/hubspot-custom-properties',
      },
      {
        type: 'doc',
        label: 'HubSpot Data Import Best Practices',
        url: 'https://docs.example.com/hubspot-data-import',
      },
    ],
  },
  {
    category: 'HubSpot / CRM',
    matchKeywords: ['integration', 'api', 'webhook', 'sync'],
    topic: 'HubSpot Integrations',
    resources: [
      {
        type: 'doc',
        label: 'HubSpot API Integration Guide',
        url: 'https://docs.example.com/hubspot-api-integration',
      },
      {
        type: 'video',
        label: 'HubSpot Webhook Setup Tutorial',
        url: 'https://www.loom.com/share/hubspot-webhook-setup',
      },
    ],
  },
  {
    category: 'HubSpot / CRM',
    topic: 'General HubSpot Support',
    resources: [
      {
        type: 'doc',
        label: 'HubSpot General Troubleshooting Guide',
        url: 'https://docs.example.com/hubspot-general-troubleshooting',
      },
    ],
  },

  // Apple Business Essentials rules
  {
    category: 'Apple Business Essentials',
    matchKeywords: ['iphone', 'ipad', 'device', 'enrollment', 'mdm'],
    topic: 'Apple Device Management',
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
    ],
  },
  {
    category: 'Apple Business Essentials',
    matchKeywords: ['user', 'account', 'license', 'subscription'],
    topic: 'Apple Business Essentials User Management',
    resources: [
      {
        type: 'doc',
        label: 'User Account Management Guide',
        url: 'https://docs.example.com/apple-user-management',
      },
    ],
  },
  {
    category: 'Apple Business Essentials',
    topic: 'General Apple Business Essentials Support',
    resources: [
      {
        type: 'doc',
        label: 'Apple Business Essentials Troubleshooting',
        url: 'https://docs.example.com/apple-business-essentials-troubleshooting',
      },
    ],
  },

  // Website rules
  {
    category: 'Website',
    matchKeywords: ['layout', 'design', 'css', 'styling', 'responsive'],
    topic: 'Website Design & Layout',
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
    ],
  },
  {
    category: 'Website',
    matchKeywords: ['broken', 'error', '404', '500', 'down'],
    matchErrorCodes: ['500', '404', '503'],
    topic: 'Website Errors & Downtime',
    resources: [
      {
        type: 'doc',
        label: 'Website Error Troubleshooting',
        url: 'https://docs.example.com/website-error-troubleshooting',
      },
      {
        type: 'doc',
        label: 'Uptime Monitoring Setup',
        url: 'https://docs.example.com/uptime-monitoring',
      },
    ],
  },
  {
    category: 'Website',
    matchKeywords: ['performance', 'slow', 'speed', 'load time'],
    topic: 'Website Performance',
    resources: [
      {
        type: 'doc',
        label: 'Website Performance Optimization',
        url: 'https://docs.example.com/website-performance',
      },
    ],
  },
  {
    category: 'Website',
    topic: 'General Website Support',
    resources: [
      {
        type: 'doc',
        label: 'Website Maintenance Guide',
        url: 'https://docs.example.com/website-maintenance',
      },
    ],
  },

  // Email Templates rules
  {
    category: 'Email Templates',
    matchKeywords: ['template', 'email', 'campaign', 'send'],
    topic: 'Email Template Management',
    resources: [
      {
        type: 'doc',
        label: 'Email Template Best Practices',
        url: 'https://docs.example.com/email-template-best-practices',
      },
      {
        type: 'video',
        label: 'Creating Effective Email Templates',
        url: 'https://www.loom.com/share/email-templates',
      },
    ],
  },
  {
    category: 'Email Templates',
    matchKeywords: ['bounce', 'delivery', 'spam', 'dkim', 'spf'],
    matchErrorCodes: ['Bounce'],
    topic: 'Email Delivery Issues',
    resources: [
      {
        type: 'doc',
        label: 'Email Delivery Troubleshooting',
        url: 'https://docs.example.com/email-delivery-troubleshooting',
      },
      {
        type: 'doc',
        label: 'SPF and DKIM Configuration',
        url: 'https://docs.example.com/spf-dkim-config',
      },
    ],
  },
  {
    category: 'Email Templates',
    topic: 'General Email Template Support',
    resources: [
      {
        type: 'doc',
        label: 'Email Template Documentation',
        url: 'https://docs.example.com/email-template-docs',
      },
    ],
  },

  // Integrations rules
  {
    category: 'Integrations',
    matchKeywords: ['api', 'webhook', 'sync', 'connection'],
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
    category: 'Integrations',
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
    category: 'Integrations',
    topic: 'General Integration Support',
    resources: [
      {
        type: 'doc',
        label: 'Integration Documentation',
        url: 'https://docs.example.com/integration-docs',
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

