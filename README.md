# mediverse-functions
- Repository for all server-side functions in Mediverse. All functions run in a docker container runtime
- The runtime is the same as the db runtime, such that they can be called offline by the database like `http://container-name:<port>/<function-name>`

## Shared across networks
- Before using this repo to create this service on coolify run a
- 
  ```Docker
  docker network create mediverse
  ```
- Then you declare `mediverse` as an external network in all services that you want to connect to these functions so they can call them locally across the docker network (n8n & supabase-db importantly)
