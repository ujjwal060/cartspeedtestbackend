# social-community

C:\aayan website\social-community\
├── app.js
├── config\
│   ├── db.js                  # MongoDB connection
│   └── loadConfig.js          # Environment-based config loader
├── controllers\               # Controllers for business logic
├── middleware\                # Middleware (e.g., auth, validation)
├── models\                    # Mongoose schemas/models
├── routes\
│   ├── index.js               # Consolidated routes
├── utils\                     # Utility functions (e.g., jwtUtils.js)
├── validators\                # Joi validation schemas
│   └── userValidator.js       # Joi schema for user validation
├── .env                       # Local environment variables
├── .gitignore                 # Ignored files (e.g., node_modules, .env)
├── package.json
└── README.md

.\loki-windows-amd64.exe --config.file="C:\aayan website\social-community\loki-config.yaml" // for loki

PS C:\Users\ABC\Downloads\grafana-enterprise-11.5.2.windows-amd64\grafana-v11.5.2\bin> .\grafana-server.exe // for grafana
