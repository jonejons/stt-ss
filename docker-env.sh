#!/bin/bash

# Docker Environment Management Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_usage() {
    echo -e "${BLUE}Usage: $0 [COMMAND] [ENVIRONMENT]${NC}"
    echo ""
    echo "Commands:"
    echo "  up        Start services"
    echo "  down      Stop services"
    echo "  build     Build services"
    echo "  restart   Restart services"
    echo "  logs      View logs"
    echo "  status    Show service status"
    echo ""
    echo "Environments:"
    echo "  dev       Development environment (docker-compose.dev.yml)"
    echo "  prod      Production environment (docker-compose.prod.yml)"
    echo "  default   Default environment (docker-compose.yml)"
    echo ""
    echo "Examples:"
    echo "  $0 up dev        # Start development environment"
    echo "  $0 down prod     # Stop production environment"
    echo "  $0 build default # Build default environment"
    echo "  $0 logs dev      # View development logs"
}

get_compose_file() {
    case $1 in
        dev|development)
            echo "docker-compose.dev.yml"
            ;;
        prod|production)
            echo "docker-compose.prod.yml"
            ;;
        default|"")
            echo "docker-compose.yml"
            ;;
        *)
            echo -e "${RED}Error: Unknown environment '$1'${NC}"
            print_usage
            exit 1
            ;;
    esac
}

run_command() {
    local command=$1
    local environment=$2
    local compose_file=$(get_compose_file $environment)
    
    echo -e "${GREEN}Running: docker compose -f $compose_file $command${NC}"
    
    case $command in
        up)
            docker compose -f $compose_file up -d
            ;;
        down)
            docker compose -f $compose_file down
            ;;
        build)
            docker compose -f $compose_file build
            ;;
        restart)
            docker compose -f $compose_file restart
            ;;
        logs)
            docker compose -f $compose_file logs -f
            ;;
        status)
            docker compose -f $compose_file ps
            ;;
        *)
            echo -e "${RED}Error: Unknown command '$command'${NC}"
            print_usage
            exit 1
            ;;
    esac
}

# Main script
if [ $# -eq 0 ]; then
    print_usage
    exit 1
fi

COMMAND=$1
ENVIRONMENT=${2:-default}

run_command $COMMAND $ENVIRONMENT

echo -e "${GREEN}Operation completed successfully!${NC}"
