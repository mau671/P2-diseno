export const openapiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Backend API',
    version: '1.0.0'
  },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      },
      Profile: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          full_name: { type: 'string', nullable: true },
          is_admin: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      DietaryRestriction: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          type: { type: 'string' }
        }
      },
      UserDietaryResponse: {
        type: 'object',
        properties: {
          restriction_ids: {
            type: 'array',
            items: { type: 'string', format: 'uuid' }
          }
        }
      },
      AuthSession: {
        type: 'object',
        properties: {
          access_token: { type: 'string' },
          refresh_token: { type: 'string' },
          expires_at: { type: 'number' }
        }
      },
      AuthUser: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          user_metadata: { type: 'object' }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    timestamp: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/auth/signup': {
      post: {
        summary: 'Sign up with email and password',
        description: 'Supabase sends a verification email before first login.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  full_name: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'User created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/AuthUser' },
                    session: { $ref: '#/components/schemas/AuthSession' }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad request',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Login with email and password',
        description: 'Login fails until the email is verified in Supabase.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Authenticated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/AuthUser' },
                    session: { $ref: '#/components/schemas/AuthSession' }
                  }
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/auth/forgot-password': {
      post: {
        summary: 'Send password reset email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Reset email sent',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad request',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/auth/refresh': {
      post: {
        summary: 'Refresh session',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refresh_token'],
                properties: {
                  refresh_token: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Session refreshed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/AuthUser' },
                    session: { $ref: '#/components/schemas/AuthSession' }
                  }
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/auth/logout': {
      post: {
        summary: 'Logout current user',
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: 'Logged out' },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/auth/me': {
      get: {
        summary: 'Get current user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Current user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/AuthUser' }
                  }
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/dietary/restrictions': {
      get: {
        summary: 'List dietary restrictions',
        parameters: [
          {
            name: 'type',
            in: 'query',
            required: false,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Restrictions list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    restrictions: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/DietaryRestriction' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/profiles/me': {
      get: {
        summary: 'Get current profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Current profile',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    profile: { $ref: '#/components/schemas/Profile' }
                  }
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/profiles/me/dietary': {
      get: {
        summary: 'Get current user dietary restrictions',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Current dietary restrictions',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/UserDietaryResponse' } }
            }
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      put: {
        summary: 'Update current user dietary restrictions',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['restriction_ids'],
                properties: {
                  restriction_ids: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' }
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Updated dietary restrictions',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/UserDietaryResponse' } }
            }
          },
          400: {
            description: 'Bad request',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    }
  }
}
