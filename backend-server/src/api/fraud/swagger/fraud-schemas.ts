import { getSchemaPath } from '@nestjs/swagger';

/**
 * Manual Swagger schema definitions for FraudModule DTOs
 * This approach bypasses NestJS Swagger's automatic schema generation
 * which has issues with deeply nested objects.
 */
export const FraudSwaggerSchemas = {
  ScoreFactors: {
    type: 'object',
    properties: {
      paymentHistory: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Payment history score factor',
        example: 0.85,
      },
      bookingBehavior: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Booking behavior score factor',
        example: 0.92,
      },
      identityVerification: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Identity verification score factor',
        example: 0.78,
      },
      deviceTrust: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Device trust score factor',
        example: 0.95,
      },
      locationConsistency: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Location consistency score factor',
        example: 0.88,
      },
      socialSignals: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Social signals score factor',
        example: 0.73,
      },
    },
  },

  BehaviorMetrics: {
    type: 'object',
    properties: {
      averageBookingValue: {
        type: 'number',
        minimum: 0,
        description: 'Average booking value in USD',
        example: 250.75,
      },
      bookingFrequency: {
        type: 'number',
        minimum: 0,
        description: 'Booking frequency (bookings per month)',
        example: 3.5,
      },
      cancellationRate: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Cancellation rate as a percentage',
        example: 0.15,
      },
      disputeRate: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Dispute rate as a percentage',
        example: 0.02,
      },
      responseTime: {
        type: 'number',
        minimum: 0,
        description: 'Average response time in minutes',
        example: 45.2,
      },
      profileCompleteness: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Profile completeness as a percentage',
        example: 0.85,
      },
    },
  },

  UpdateFraudScore: {
    type: 'object',
    properties: {
      overallScore: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description: 'Overall fraud score (0-100)',
        example: 25.5,
      },
      riskLevel: {
        type: 'string',
        enum: ['very_low', 'low', 'medium', 'high', 'very_high'],
        description: 'Risk level assessment',
        example: 'low',
      },
      scoreFactors: {
        $ref: '#/components/schemas/ScoreFactors',
        description: 'Detailed score factors breakdown',
      },
      behaviorMetrics: {
        $ref: '#/components/schemas/BehaviorMetrics',
        description: 'User behavior metrics',
      },
      activeFlags: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Active fraud flags',
        example: ['suspicious_payment', 'multiple_accounts'],
      },
      notes: {
        type: 'string',
        description: 'Additional notes about the fraud assessment',
        example: 'User shows consistent booking patterns',
      },
    },
  },
};

/**
 * Helper function to register custom schemas in Swagger document
 */
export function addFraudSchemasToSwagger(document: any) {
  if (!document.components) {
    document.components = {};
  }
  if (!document.components.schemas) {
    document.components.schemas = {};
  }

  // Add custom schemas
  document.components.schemas.ScoreFactors = FraudSwaggerSchemas.ScoreFactors;
  document.components.schemas.BehaviorMetrics =
    FraudSwaggerSchemas.BehaviorMetrics;
  document.components.schemas.UpdateFraudScore =
    FraudSwaggerSchemas.UpdateFraudScore;

  return document;
}
