# mediverse-functions
- Repository for server-side functions in Mediverse. All functions run in a docker container runtime
- The runtime is the same as the db runtime, such that they can be called offline by the database like `http://container-name:<port>/<function-name>`

## Shared across networks
- Before using this repo to create this service on coolify run a
  ```Docker
  docker network create mediverse-net
  ```
- Then you declare `mediverse` as an external network in all services that you want to connect to these functions so they can call them locally across the docker network (n8n & supabase-db importantly)
- An example yaml will be as like below
  ```yaml
  # network declared as external here
    networks:
    default:
      external:
        name: shared_net
  # services now register themselves to that network as follows in their respective compose.yml files
  services:
    functions:
      image: our‑functions‑service
      networks:
        - default
    supabase-db:
      image: our‑db
      networks:
        - default
    n8n-service:
      image: our‑n8n-service
      networks:
        - default
  ```
- So this way you run all the functions in their own container and not in the container of the db or n8n, and they will all talk on the shared network
