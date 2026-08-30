const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BlueMoon Apartment Management API',
      version: '1.0.0',
      description: 'API documentation for BlueMoon backend'
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },

    security: [
      {
        BearerAuth: []
      }
    ]
    },
    servers: [
      {
        url: 'http://localhost:3001',
      },
    ],
  
    apis: ['./src/routes/*.js']
};

module.exports = swaggerJSDoc(options);
