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
          phone: { type: 'string', nullable: true },
          avatar_url: { type: 'string', nullable: true },
          date_of_birth: { type: 'string', format: 'date', nullable: true },
          preferred_language: { type: 'string' },
          notification_preferences: { type: 'object' },
          preferred_currency_code: { type: 'string', nullable: true },
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
      Ingredient: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          category_id: { type: 'string', format: 'uuid' },
          category_name: { type: 'string' },
          restaurant_id: { type: 'string', format: 'uuid' },
          unit_price: { type: 'string' },
          stock: { type: 'integer' },
          is_active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      Address: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          label: { type: 'string', nullable: true },
          isDefault: { type: 'boolean' },
          address: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              line1: { type: 'string' },
              line2: { type: 'string', nullable: true },
              postalCode: { type: 'string', nullable: true },
              notes: { type: 'string', nullable: true },
              city: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' }
                }
              },
              region: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' }
                }
              },
              country: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  nameEs: { type: 'string' },
                  nameEn: { type: 'string' }
                }
              }
            }
          }
        }
      },
      PaymentMethod: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          type: { type: 'string' },
          name: { type: 'string' },
          lastFour: { type: 'string', nullable: true },
          expiryMonth: { type: 'integer', nullable: true },
          expiryYear: { type: 'integer', nullable: true },
          isDefault: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      OrderItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          baseName: { type: 'string' },
          quantity: { type: 'integer' },
          unitPrice: { type: 'string' },
          subtotal: { type: 'string' }
        }
      },
      OrderSummary: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string' },
          total: { type: 'string' },
          currency: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/OrderItem' }
          },
          deliveryAddress: {
            type: 'object',
            nullable: true,
            properties: {
              line1: { type: 'string' },
              line2: { type: 'string', nullable: true },
              city: { type: 'string', nullable: true },
              region: { type: 'string', nullable: true },
              country: { type: 'string', nullable: true }
            }
          }
        }
      },
      RecurringOrder: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string' },
          frequency: { type: 'string' },
          next_run_at: { type: 'string', format: 'date-time' },
          delivery_address_id: { type: 'string', format: 'uuid', nullable: true },
          payment_method_id: { type: 'string', format: 'uuid', nullable: true },
          currency_code: { type: 'string' },
          restaurant_id: { type: 'string', format: 'uuid' }
        }
      },
      AccessSummary: {
        type: 'object',
        properties: {
          is_admin: { type: 'boolean' },
          restaurants: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                restaurant_id: { type: 'string', format: 'uuid' },
                restaurant_name: { type: 'string' },
                role: { type: 'string' }
              }
            }
          }
        }
      },
      IngredientsList: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/Ingredient' }
          },
          page: { type: 'integer' },
          page_size: { type: 'integer' },
          total: { type: 'integer' }
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
    '/ingredients': {
      get: {
        summary: 'List ingredients',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'category', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'is_active', in: 'query', required: false, schema: { type: 'boolean' } },
          { name: 'restaurant_id', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'page', in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'page_size', in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'sort', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'order', in: 'query', required: false, schema: { type: 'string', enum: ['asc', 'desc'] } }
        ],
        responses: {
          200: {
            description: 'Ingredients list',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/IngredientsList' } }
            }
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      post: {
        summary: 'Create ingredient',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'category_id', 'restaurant_id', 'unit_price', 'stock'],
                properties: {
                  name: { type: 'string' },
                  category_id: { type: 'string', format: 'uuid' },
                  restaurant_id: { type: 'string', format: 'uuid' },
                  unit_price: { type: 'number', minimum: 0 },
                  stock: { type: 'integer', minimum: 0 },
                  is_active: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Ingredient created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ingredient: { $ref: '#/components/schemas/Ingredient' }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad request',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          403: {
            description: 'Forbidden',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/ingredients/{id}': {
      get: {
        summary: 'Get ingredient by id',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'restaurant_id', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: {
            description: 'Ingredient detail',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ingredient: { $ref: '#/components/schemas/Ingredient' }
                  }
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      put: {
        summary: 'Update ingredient',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'restaurant_id', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  category_id: { type: 'string', format: 'uuid' },
                  unit_price: { type: 'number', minimum: 0 },
                  stock: { type: 'integer', minimum: 0 },
                  is_active: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Ingredient updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ingredient: { $ref: '#/components/schemas/Ingredient' }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad request',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          403: {
            description: 'Forbidden',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      delete: {
        summary: 'Deactivate ingredient',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'restaurant_id', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: {
            description: 'Ingredient deactivated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ingredient: { $ref: '#/components/schemas/Ingredient' }
                  }
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          403: {
            description: 'Forbidden',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
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
      },
      put: {
        summary: 'Update current profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  full_name: { type: 'string' },
                  phone: { type: 'string' },
                  avatar_url: { type: 'string' },
                  date_of_birth: { type: 'string', format: 'date' },
                  preferred_language: { type: 'string' },
                  preferred_currency_code: { type: 'string' },
                  notification_preferences: { type: 'object' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Updated profile',
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
    },
    '/profiles/me/addresses': {
      get: {
        summary: 'List saved addresses',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Addresses list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    addresses: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Address' }
                    }
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
      },
      post: {
        summary: 'Create address',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['line1', 'cityId', 'regionId', 'countryId'],
                properties: {
                  label: { type: 'string' },
                  isDefault: { type: 'boolean' },
                  line1: { type: 'string' },
                  line2: { type: 'string' },
                  cityId: { type: 'string', format: 'uuid' },
                  regionId: { type: 'string', format: 'uuid' },
                  countryId: { type: 'string', format: 'uuid' },
                  postalCode: { type: 'string' },
                  notes: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Address created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    address_id: { type: 'string', format: 'uuid' }
                  }
                }
              }
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
    },
    '/profiles/me/addresses/{addressId}': {
      put: {
        summary: 'Update address',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'addressId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object' }
            }
          }
        },
        responses: {
          200: { description: 'Address updated' },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      delete: {
        summary: 'Delete address',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'addressId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          204: { description: 'Deleted' },
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
    },
    '/profiles/me/addresses/{addressId}/default': {
      patch: {
        summary: 'Set default address',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'addressId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: { description: 'Default updated' },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/locations/countries': {
      get: {
        summary: 'List countries',
        responses: {
          200: { description: 'Countries list' }
        }
      }
    },
    '/locations/regions': {
      get: {
        summary: 'List regions',
        parameters: [
          { name: 'countryId', in: 'query', required: false, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: { description: 'Regions list' }
        }
      }
    },
    '/locations/cities': {
      get: {
        summary: 'List cities',
        parameters: [
          { name: 'regionId', in: 'query', required: false, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: { description: 'Cities list' }
        }
      }
    },
    '/profiles/me/payment-methods': {
      get: {
        summary: 'List payment methods',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Payment methods',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    payment_methods: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/PaymentMethod' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create payment method',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'name'],
                properties: {
                  type: { type: 'string' },
                  name: { type: 'string' },
                  last_four: { type: 'string' },
                  expiry_month: { type: 'integer' },
                  expiry_year: { type: 'integer' },
                  is_default: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Payment method created' }
        }
      }
    },
    '/profiles/me/payment-methods/{id}': {
      put: {
        summary: 'Update payment method',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: { 200: { description: 'Payment method updated' } }
      },
      delete: {
        summary: 'Delete payment method',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: { 204: { description: 'Deleted' } }
      }
    },
    '/profiles/me/payment-methods/{id}/default': {
      patch: {
        summary: 'Set default payment method',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: { 200: { description: 'Default updated' } }
      }
    },
    '/profiles/me/orders': {
      get: {
        summary: 'List user orders',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'status', in: 'query', required: false, schema: { type: 'string' } }
        ],
        responses: {
          200: {
            description: 'Orders list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    orders: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/OrderSummary' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/profiles/me/access': {
      get: {
        summary: 'Get access summary',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Access summary',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AccessSummary' }
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
    '/orders/{orderId}/status': {
      patch: {
        summary: 'Update order status (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'orderId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: { status: { type: 'string' } }
              }
            }
          }
        },
        responses: { 200: { description: 'Order updated' } }
      }
    },
    '/profiles/me/recurring-orders': {
      get: {
        summary: 'List recurring orders',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Recurring orders',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    recurring_orders: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/RecurringOrder' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create recurring order',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object' }
            }
          }
        },
        responses: { 201: { description: 'Recurring order created' } }
      }
    },
    '/profiles/me/recurring-orders/{id}': {
      put: {
        summary: 'Update recurring order',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: { 200: { description: 'Recurring order updated' } }
      }
    },
    '/profiles/me/recurring-orders/{id}/status': {
      patch: {
        summary: 'Update recurring order status',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: { 200: { description: 'Recurring order status updated' } }
      }
    },
    '/profiles/me/recurring-orders/{id}/run': {
      post: {
        summary: 'Run recurring order now',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: { 201: { description: 'Order created' } }
      }
    },
    '/restaurants': {
      get: {
        summary: 'List restaurants',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'city_id', in: 'query', required: false, schema: { type: 'string', format: 'uuid' } },
          { name: 'is_active', in: 'query', required: false, schema: { type: 'boolean' } },
          { name: 'page', in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'page_size', in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'sort', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'order', in: 'query', required: false, schema: { type: 'string', enum: ['asc', 'desc'] } }
        ],
        responses: {
          200: {
            description: 'Restaurants list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    restaurants: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          name: { type: 'string' },
                          description: { type: 'string', nullable: true },
                          address: { type: 'string', nullable: true },
                          city: { type: 'string', nullable: true },
                          image_url: { type: 'string', nullable: true },
                          rating: { type: 'number', nullable: true },
                          is_active: { type: 'boolean' },
                          created_at: { type: 'string', format: 'date-time' }
                        }
                      }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        page_size: { type: 'integer' },
                        total: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/restaurants/{id}': {
      get: {
        summary: 'Get restaurant by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: {
            description: 'Restaurant detail',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    restaurant: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        address: { type: 'string', nullable: true },
                        city_id: { type: 'string', format: 'uuid', nullable: true },
                        city_name: { type: 'string', nullable: true },
                        image_url: { type: 'string', nullable: true },
                        phone: { type: 'string', nullable: true },
                        email: { type: 'string', nullable: true },
                        opening_hours: { type: 'object', nullable: true },
                        is_active: { type: 'boolean' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          },
          404: {
            description: 'Not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/restaurants/{id}/menu': {
      get: {
        summary: 'Get restaurant menu',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'category', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'search', in: 'query', required: false, schema: { type: 'string' } }
        ],
        responses: {
          200: {
            description: 'Restaurant menu',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    restaurant: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' }
                      }
                    },
                    categories: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          name: { type: 'string' },
                          sort_order: { type: 'integer' }
                        }
                      }
                    },
                    meal_bases: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          name: { type: 'string' },
                          description: { type: 'string', nullable: true },
                          base_price: { type: 'string' },
                          category_id: { type: 'string', format: 'uuid' },
                          category_name: { type: 'string' },
                          is_active: { type: 'boolean' },
                          image_url: { type: 'string', nullable: true },
                          dietary_warnings: { type: 'array', items: { type: 'string' } },
                          ingredients: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'string', format: 'uuid' },
                                name: { type: 'string' },
                                category: { type: 'string' },
                                is_selectable: { type: 'boolean' },
                                is_required: { type: 'boolean' },
                                max_quantity: { type: 'integer', nullable: true },
                                unit_price: { type: 'string', nullable: true }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/kitchens': {
      get: {
        summary: 'List kitchens',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Kitchens list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    kitchens: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          name: { type: 'string' },
                          restaurant_id: { type: 'string', format: 'uuid' },
                          is_active: { type: 'boolean' },
                          created_at: { type: 'string', format: 'date-time' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create kitchen',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'restaurant_id'],
                properties: {
                  name: { type: 'string' },
                  restaurant_id: { type: 'string', format: 'uuid' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Kitchen created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    kitchen: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        restaurant_id: { type: 'string', format: 'uuid' },
                        is_active: { type: 'boolean' },
                        created_at: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/kitchens/{id}': {
      get: {
        summary: 'Get kitchen by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: {
            description: 'Kitchen detail',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    kitchen: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        restaurant_id: { type: 'string', format: 'uuid' },
                        is_active: { type: 'boolean' },
                        created_at: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      put: {
        summary: 'Update kitchen',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  is_active: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Kitchen updated' },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      },
      delete: {
        summary: 'Delete kitchen',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          204: { description: 'Kitchen deleted' },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/meal-bases': {
      get: {
        summary: 'List meal bases',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'restaurant_id', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'category_id', in: 'query', required: false, schema: { type: 'string', format: 'uuid' } },
          { name: 'search', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'is_active', in: 'query', required: false, schema: { type: 'boolean' } },
          { name: 'page', in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'page_size', in: 'query', required: false, schema: { type: 'integer' } }
        ],
        responses: {
          200: {
            description: 'Meal bases list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          name: { type: 'string' },
                          description: { type: 'string', nullable: true },
                          base_price: { type: 'string' },
                          category_id: { type: 'string', format: 'uuid' },
                          category_name: { type: 'string' },
                          is_active: { type: 'boolean' },
                          image_url: { type: 'string', nullable: true },
                          dietary_warnings: { type: 'array', items: { type: 'string' } },
                          ingredients: { type: 'array', items: { type: 'object' } }
                        }
                      }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        page_size: { type: 'integer' },
                        total: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create meal base',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'base_price', 'restaurant_id', 'category_id'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  base_price: { type: 'number', minimum: 0 },
                  restaurant_id: { type: 'string', format: 'uuid' },
                  category_id: { type: 'string', format: 'uuid' },
                  image_url: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Meal base created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    meal_base: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/meal-bases/{id}': {
      get: {
        summary: 'Get meal base by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: {
            description: 'Meal base detail',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    meal_base: { type: 'object' },
                    dietary_warnings: { type: 'array', items: { type: 'string' } },
                    ingredients: { type: 'array', items: { type: 'object' } }
                  }
                }
              }
            }
          }
        }
      },
      put: {
        summary: 'Update meal base',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  base_price: { type: 'number', minimum: 0 },
                  category_id: { type: 'string', format: 'uuid' },
                  image_url: { type: 'string' },
                  is_active: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Meal base updated' },
          404: { description: 'Not found' }
        }
      },
      delete: {
        summary: 'Delete meal base',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          204: { description: 'Meal base deleted' },
          404: { description: 'Not found' }
        }
      }
    },
    '/meal-bases/{id}/ingredients': {
      put: {
        summary: 'Update meal base ingredients',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ingredients: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        ingredient_id: { type: 'string', format: 'uuid' },
                        is_required: { type: 'boolean' },
                        max_quantity: { type: 'integer', nullable: true },
                        is_selectable: { type: 'boolean' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Meal base ingredients updated' }
        }
      }
    },
    '/cart': {
      get: {
        summary: 'Get current cart',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Cart detail',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    cart: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        restaurant_id: { type: 'string', format: 'uuid' },
                        restaurant_name: { type: 'string' },
                        items: { type: 'array', items: { type: 'object' } },
                        subtotal: { type: 'string' },
                        warnings: { type: 'array', items: { type: 'string' } },
                        price_changed: { type: 'boolean' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Add item to cart',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['meal_base_id', 'quantity', 'selected_ingredients', 'restaurant_id'],
                properties: {
                  meal_base_id: { type: 'string', format: 'uuid' },
                  quantity: { type: 'integer', minimum: 1 },
                  selected_ingredients: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        ingredient_id: { type: 'string', format: 'uuid' },
                        quantity: { type: 'integer', minimum: 1 }
                      }
                    }
                  },
                  notes: { type: 'string' },
                  restaurant_id: { type: 'string', format: 'uuid' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Item added to cart',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    cart: { type: 'object' },
                    item: { type: 'object' },
                    warnings: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Clear cart',
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: 'Cart cleared' }
        }
      }
    },
    '/cart/items/{itemId}': {
      put: {
        summary: 'Update cart item',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'itemId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  quantity: { type: 'integer', minimum: 1 },
                  selected_ingredients: { type: 'array' },
                  notes: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Cart item updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    cart: { type: 'object' },
                    item: { type: 'object' },
                    warnings: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Remove cart item',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'itemId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: {
            description: 'Cart item removed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    cart: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/cart/validate': {
      post: {
        summary: 'Validate cart prices',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Cart validation result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    valid: { type: 'boolean' },
                    items: { type: 'array' },
                    subtotal: { type: 'string' },
                    original_subtotal: { type: 'string', nullable: true },
                    price_changes: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          item_id: { type: 'string' },
                          original_price: { type: 'string' },
                          new_price: { type: 'string' },
                          difference: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/payments': {
      post: {
        summary: 'Process payment',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['payment_method_id', 'cart_id'],
                properties: {
                  payment_method_id: { type: 'string', format: 'uuid' },
                  cart_id: { type: 'string', format: 'uuid' },
                  delivery_address_id: { type: 'string', format: 'uuid' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Payment processed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    payment: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        status: { type: 'string' },
                        amount: { type: 'string' },
                        currency_code: { type: 'string' },
                        payment_method_id: { type: 'string', format: 'uuid' }
                      }
                    },
                    order: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/payments/methods': {
      get: {
        summary: 'Get available payment methods',
        responses: {
          200: {
            description: 'Payment methods',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    methods: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          type: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/saved-meals': {
      get: {
        summary: 'List saved meals',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Saved meals list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    saved_meals: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          name: { type: 'string' },
                          meal_base: { type: 'object' },
                          selected_ingredients: { type: 'array' },
                          total_price: { type: 'string' },
                          created_at: { type: 'string', format: 'date-time' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Save a meal from cart',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['cart_item_id', 'name'],
                properties: {
                  cart_item_id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Meal saved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    saved_meal: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/saved-meals/{id}': {
      delete: {
        summary: 'Delete saved meal',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          204: { description: 'Saved meal deleted' }
        }
      }
    },
    '/saved-meals/{id}/add-to-cart': {
      post: {
        summary: 'Add saved meal to cart',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['restaurant_id', 'quantity'],
                properties: {
                  restaurant_id: { type: 'string', format: 'uuid' },
                  quantity: { type: 'integer', minimum: 1 }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Meal added to cart',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    cart: { type: 'object' },
                    item: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/recurring-orders': {
      get: {
        summary: 'List recurring orders',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'page', in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'page_size', in: 'query', required: false, schema: { type: 'integer' } }
        ],
        responses: {
          200: {
            description: 'Recurring orders',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    recurring_orders: { type: 'array', items: { type: 'object' } },
                    pagination: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create recurring order',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'cart_id', 'frequency', 'start_date', 'restaurant_id'],
                properties: {
                  name: { type: 'string' },
                  cart_id: { type: 'string', format: 'uuid' },
                  frequency: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['weekly', 'biweekly', 'monthly', 'custom_days'] },
                      weekly_days: { type: 'array', items: { type: 'integer' }, nullable: true },
                      every_n_days: { type: 'integer', nullable: true },
                      monthly_day: { type: 'integer', nullable: true }
                    }
                  },
                  start_date: { type: 'string', format: 'date' },
                  end_date: { type: 'string', format: 'date', nullable: true },
                  delivery_address_id: { type: 'string', format: 'uuid' },
                  payment_method_id: { type: 'string', format: 'uuid' },
                  restaurant_id: { type: 'string', format: 'uuid' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Recurring order created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    recurring_order: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/recurring-orders/{id}': {
      get: {
        summary: 'Get recurring order detail',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: {
            description: 'Recurring order detail',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    recurring_order: { type: 'object' },
                    next_runs: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          }
        }
      },
      put: {
        summary: 'Update recurring order',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  frequency: { type: 'object' },
                  start_date: { type: 'string', format: 'date' },
                  end_date: { type: 'string', format: 'date' },
                  delivery_address_id: { type: 'string', format: 'uuid' },
                  payment_method_id: { type: 'string', format: 'uuid' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Recurring order updated' }
        }
      },
      delete: {
        summary: 'Delete recurring order',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          204: { description: 'Recurring order deleted' }
        }
      }
    },
    '/recurring-orders/{id}/pause': {
      post: {
        summary: 'Pause recurring order',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: { description: 'Recurring order paused' }
        }
      }
    },
    '/recurring-orders/{id}/resume': {
      post: {
        summary: 'Resume recurring order',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: { description: 'Recurring order resumed' }
        }
      }
    },
    '/admin/restaurants': {
      get: {
        summary: 'List restaurants for admin',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Admin restaurants list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    restaurants: { type: 'array', items: { type: 'object' } },
                    pagination: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/admin/restaurants/{id}': {
      get: {
        summary: 'Get restaurant admin details',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: {
            description: 'Restaurant admin details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    restaurant: { type: 'object' },
                    stats: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/admin/restaurants/{id}/orders': {
      get: {
        summary: 'List restaurant orders',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'status', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'page', in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'page_size', in: 'query', required: false, schema: { type: 'integer' } }
        ],
        responses: {
          200: {
            description: 'Restaurant orders',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    orders: { type: 'array', items: { type: 'object' } },
                    pagination: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/admin/restaurants/{id}/ingredients': {
      get: {
        summary: 'List restaurant ingredients',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: {
            description: 'Restaurant ingredients',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ingredients: { type: 'array', items: { type: 'object' } }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/ingredient-categories': {
      get: {
        summary: 'List ingredient categories',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'restaurant_id', in: 'query', required: false, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: {
            description: 'Ingredient categories',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    categories: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          name: { type: 'string' },
                          sort_order: { type: 'integer' },
                          is_required: { type: 'boolean' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create ingredient category',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'restaurant_id'],
                properties: {
                  name: { type: 'string' },
                  restaurant_id: { type: 'string', format: 'uuid' },
                  sort_order: { type: 'integer' },
                  is_required: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Category created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    category: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/ingredient-categories/{id}': {
      put: {
        summary: 'Update ingredient category',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  sort_order: { type: 'integer' },
                  is_required: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Category updated' }
        }
      },
      delete: {
        summary: 'Delete ingredient category',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          204: { description: 'Category deleted' }
        }
      }
    }
  }
}
