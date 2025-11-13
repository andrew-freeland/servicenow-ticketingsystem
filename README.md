# ServiceNow Enterprise Integration Platform

A production-ready enterprise integration framework for ServiceNow, demonstrating advanced API integration patterns, comprehensive documentation practices, and enterprise-grade error handling. This project showcases full-stack development capabilities with TypeScript, Node.js, and REST API integration.

## Project Overview

This repository contains a complete ServiceNow integration platform with a working Client Support Counter application. The project demonstrates enterprise-level software engineering practices including:

- Enterprise API integration with ServiceNow Table API
- Comprehensive validation and error handling systems
- Production-ready authentication patterns (Basic Auth, OAuth 2.0, API Key)
- Automated classification and resource recommendation systems
- Complete documentation framework with 12+ technical specification documents
- TypeScript-based architecture with Zod schema validation
- Modular, testable code structure following SOLID principles

## Technical Highlights

### Enterprise Integration Capabilities

- **ServiceNow Table API Integration**: Full CRUD operations with proper pagination, field selection, and query optimization
- **Multi-Authentication Support**: Basic Auth, OAuth 2.0, and API Key authentication with secure credential management
- **Robust Error Handling**: Exponential backoff retry logic for rate limiting (429) and server errors (5xx), with proper handling of client errors (4xx)
- **Production-Ready Patterns**: Environment variable configuration, secret redaction in logs, least-privilege access control

### Architecture & Code Quality

- **TypeScript + Node.js**: Type-safe development with strict TypeScript configuration
- **Zod Schema Validation**: Runtime type validation for all API inputs and outputs
- **Modular Architecture**: Clean separation of concerns with dedicated modules for clients, services, and utilities
- **Comprehensive Testing**: Seed data generators and test utilities for integration testing

### Documentation Excellence

- **12+ Technical Specification Documents**: Complete documentation covering rulesets, validators, API guides, error handling, and setup procedures
- **Cross-Referenced Documentation**: All documents include proper cross-references and table of contents
- **Production-Ready Guides**: Setup guides, API references, and troubleshooting documentation

## Client Support Counter Application

A fully functional help desk application that demonstrates real-world ServiceNow integration:

### Features

- **Incident Management**: Create, list, and manage ServiceNow incidents through REST API
- **Auto-Classification**: Intelligent classification system that categorizes incidents and recommends resources
- **Automation Activity Tracking**: Real-time tracking of automation events through ServiceNow work notes
- **Knowledge Base Integration**: KB article suggestions based on incident descriptions
- **Statistics & Analytics**: Help desk metrics and deflection tracking

### Technology Stack

- **Backend**: Node.js with Express.js
- **Language**: TypeScript with strict type checking
- **Validation**: Zod for schema validation
- **API Client**: Custom ServiceNow Table API wrapper with retry logic
- **Authentication**: Multi-method support (Basic, OAuth, API Key)

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (or npm)
- ServiceNow Personal Developer Instance (PDI)

### Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your ServiceNow PDI credentials

# 3. Seed data
pnpm seed

# 4. Start development server
pnpm dev
```

The server will start on `http://localhost:3000` (or port specified in `PORT`).

### API Testing

```bash
# Health check
curl -s http://localhost:3000/health

# List incidents
curl -s http://localhost:3000/incidents

# Create incident
curl -s -X POST http://localhost:3000/incident \
  -H "Content-Type: application/json" \
  -d '{"client":"Test Client","category":"Other","shortDescription":"Test incident"}'

# Get automation activity
curl -s http://localhost:3000/automation-activity?limit=50

# Get statistics
curl -s http://localhost:3000/stats
```

## Documentation

### Application Documentation

- **[API Reference](docs/API_REFERENCE.md)** - Complete API endpoint documentation
- **[Architecture](docs/ARCHITECTURE.md)** - System architecture and design decisions
- **[ServiceNow Integration](docs/SERVICE_NOW.md)** - ServiceNow API usage patterns
- **[Runbook](docs/RUNBOOK.md)** - Operational guide and troubleshooting

### ServiceNow Integration Documentation

Full documentation lives in: `/docs/servicenow/`

#### Core Documentation

- **[ServiceNow Integration Ruleset v1.0](docs/servicenow/SERVICENOW_RULESET_v1.0.md)** - Canonical knowledge base defining all ServiceNow integration rules, authentication patterns, API usage, and best practices.
- **[Integration Validator](docs/servicenow/INTEGRATION_VALIDATOR.md)** - 7-category validation system that enforces ruleset compliance before code generation.
- **[Validator Meta-Context](docs/servicenow/VALIDATOR_META_CONTEXT.md)** - Interpretation guide explaining how to apply the validator, no-assumptions policy, and clarification protocols.
- **[Default Architectural Profile (DAP v1.0)](docs/servicenow/DAP_v1.0.md)** - Default project structure, directory layout, naming conventions, and TypeScript defaults.

#### Backend & Integration

- **[ServiceNow Backend Flow](docs/servicenow/SERVICENOW_BACKEND_FLOW.md)** - Complete end-to-end pipeline describing what happens when UI submits a request, including incident creation, classification, and notifications.
- **[BBP Support Counter Backend Spec](docs/servicenow/BBP_SUPPORT_COUNTER_BACKEND_SPEC.md)** - Full backend specification for ticket creation, ServiceNow enrichment, classification logic, and automation activity extraction.
- **[ServiceNow Field Mappings](docs/servicenow/SERVICENOW_FIELD_MAPPINGS.md)** - Complete reference for how UI form fields map to ServiceNow incident fields, including priority and category mappings.
- **[ServiceNow Automations](docs/servicenow/SERVICENOW_AUTOMATIONS.md)** - Classification rules, resource recommendations, work notes format, and how automation activity is tracked.
- **[ServiceNow Notifications](docs/servicenow/SERVICENOW_NOTIFICATIONS.md)** - Email notification rules, templates, and when Andrew and clients receive notifications.

#### API & Error Handling

- **[ServiceNow Table API Guide](docs/servicenow/SERVICENOW_TABLE_API_GUIDE.md)** - Complete API usage reference with GET/POST/PATCH examples, query parameters, pagination, and best practices.
- **[ServiceNow Error Handling Guide](docs/servicenow/SERVICENOW_ERROR_HANDLING_GUIDE.md)** - Retry strategies, error categories, logging format with secret redaction, and common error scenarios.

#### Setup & Configuration

- **[ServiceNow Setup Guide](docs/servicenow/SERVICENOW_SETUP.md)** - Getting started with PDI credentials, required roles, API access configuration, and how to find field names and debug data policy failures.

## Architecture Overview

### System Architecture

```
Client (Browser)
    ↓
Express Server (Node.js/TypeScript)
    ↓
ServiceNow Client (API Wrapper)
    ↓
ServiceNow Table API
    ↓
ServiceNow PDI Instance
```

### Key Components

- **Express Server**: HTTP API server with validation middleware
- **ServiceNow Client**: Reusable API wrapper with retry logic and error handling
- **Classification Engine**: Pure function for topic classification and resource recommendations
- **Automation Module**: Category-specific automation logic with email notifications
- **Contact Resolution**: Email address resolution with future ServiceNow CRM integration

### Code Organization

```
/src
  /clients          # API clients (ServiceNow, etc.)
  /docsdesk         # Domain-specific modules (intake, classification, automation)
  /utils            # Shared utilities (logger, retry, validation)
  /seed             # Test data generators
/config             # Environment configuration
/docs               # Complete documentation
```

## Key Technical Decisions

### Authentication & Security

- **Multi-Method Support**: Basic Auth (default), OAuth 2.0, and API Key authentication
- **Secure Credential Storage**: Environment variables in development, GCP Secret Manager ready for production
- **Least-Privilege Access**: Service accounts with minimal required roles (web_service_admin, itil, itil_admin)
- **Secret Redaction**: All logs automatically redact passwords, API keys, and tokens

### Error Handling & Resilience

- **Exponential Backoff**: Retry logic with jitter for rate limiting (429) and server errors (5xx)
- **No Retry on Client Errors**: Proper handling of 4xx errors without unnecessary retries
- **Capped Retries**: Maximum 5 attempts to prevent infinite loops
- **Comprehensive Logging**: All errors logged with context and redacted secrets

### API Integration Patterns

- **Field Selection**: Always use sysparm_fields to minimize payload size
- **Pagination**: Proper pagination for large datasets (1,000 records per call recommended)
- **PATCH for Updates**: Use PATCH instead of PUT for partial updates
- **Input Validation**: Zod schemas validate all inputs before API calls

## Validation Framework

The project includes a comprehensive 7-category validation system that ensures all ServiceNow integrations comply with best practices:

1. **Ruleset Compliance** - Alignment with canonical integration rules
2. **Architecture & Modularity** - Code structure and organization
3. **Authentication** - Auth patterns and credential management
4. **API Syntax** - Correct API usage and query parameters
5. **Error Handling** - Retry logic and error management
6. **Documentation** - Required documentation completeness
7. **Instance Constraints** - PDI compatibility and limitations

## Production Readiness

### Security

- No hardcoded credentials
- Environment variable configuration
- Secret redaction in logs
- Least-privilege role assignment
- Secure authentication methods

### Reliability

- Exponential backoff retry logic
- Proper error categorization
- Comprehensive error logging
- Idempotent operations
- Graceful degradation

### Maintainability

- TypeScript for type safety
- Modular architecture
- Comprehensive documentation
- Clear separation of concerns
- Test utilities and seed data

## ServiceNow PDI Constraints

ServiceNow Personal Developer Instances have specific limitations that this project handles:

- **10-Minute Inactivity Shutdown**: Instance automatically shuts down after inactivity
- **7-Day Reset Cycle**: Instance resets if not accessed within 7 days
- **Ephemeral Data**: All data is temporary and may be lost
- **Manual Plugin Activation**: Plugins must be enabled manually (cannot be done via API)

The integration is designed to be resilient to these constraints with idempotent operations and proper error handling.

## Skills Demonstrated

This project demonstrates proficiency in:

- **Enterprise API Integration**: ServiceNow Table API, REST API design, authentication patterns
- **TypeScript Development**: Type-safe code, interfaces, generics, strict type checking
- **Node.js/Express**: Server-side development, middleware, routing, error handling
- **Schema Validation**: Zod for runtime type validation
- **Error Handling**: Retry logic, exponential backoff, error categorization
- **Security Best Practices**: Credential management, secret redaction, least-privilege access
- **Documentation**: Comprehensive technical documentation with cross-references
- **Software Architecture**: Modular design, separation of concerns, SOLID principles
- **Testing**: Test data generation, integration testing utilities

## Related Resources

- [ServiceNow Developer Portal](https://developer.servicenow.com/)
- [ServiceNow API Documentation](https://docs.servicenow.com/)
- [ServiceNow REST API Explorer](https://docs.servicenow.com/bundle/vancouver-application-development/page/integrate/inbound-rest/concept/c_RESTAPI.html)

## License

This repository contains documentation and code for ServiceNow integration development. Use freely for ServiceNow integration projects.

---

*Last Updated: 2024*
