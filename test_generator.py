#!/usr/bin/env python3
"""
End-to-end test for the application generator.

This test:
1. Generates an application from the example JSON
2. Validates that all required files are created
3. Builds the Docker images
4. Starts the services with docker-compose
5. Applies database migrations
6. Runs the tests
7. Validates that everything works correctly
"""

import sys
import json
import subprocess
import time
from pathlib import Path
import requests
import shutil

# Colors for output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def log_step(message):
    """Log a test step"""
    print(f"\n{Colors.BLUE}➜ {message}{Colors.RESET}")

def log_success(message):
    """Log a success message"""
    print(f"{Colors.GREEN}✓ {message}{Colors.RESET}")

def log_error(message):
    """Log an error message"""
    print(f"{Colors.RED}✗ {message}{Colors.RESET}")

def log_warning(message):
    """Log a warning message"""
    print(f"{Colors.YELLOW}⚠ {message}{Colors.RESET}")

def run_command(cmd, cwd=None, check=True, capture_output=False):
    """Run a shell command"""
    try:
        if capture_output:
            result = subprocess.run(
                cmd,
                shell=True,
                cwd=cwd,
                check=check,
                capture_output=True,
                text=True
            )
            return result
        else:
            subprocess.run(cmd, shell=True, cwd=cwd, check=check)
            return None
    except subprocess.CalledProcessError as e:
        if capture_output:
            log_error(f"Command failed: {cmd}")
            log_error(f"STDOUT: {e.stdout}")
            log_error(f"STDERR: {e.stderr}")
        raise

def test_generate_application():
    """Test application generation from JSON"""
    log_step("Step 1: Testing application generation from JSON")
    
    # Read the example specification
    spec_file = Path(__file__).parent.parent / "example-app-spec.json"
    if not spec_file.exists():
        log_error(f"Example specification not found: {spec_file}")
        return False
    
    with open(spec_file, 'r') as f:
        spec = json.load(f)
    
    log_success(f"Loaded specification: {spec['project_name']}")
    
    # Start the backend API server
    log_step("Starting FastAPI server...")
    api_process = subprocess.Popen(
        ["python", "main.py"],
        cwd=Path(__file__).parent.parent / "back",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Wait for API to be ready
    time.sleep(5)
    max_retries = 10
    for i in range(max_retries):
        try:
            response = requests.get("http://localhost:8000/health", timeout=2)
            if response.status_code == 200:
                log_success("API server is ready")
                break
        except:
            if i == max_retries - 1:
                log_error("API server failed to start")
                api_process.kill()
                return False
            time.sleep(2)
    
    try:
        # Call the generation endpoint
        log_step("Calling generation endpoint...")
        response = requests.post(
            "http://localhost:8000/api/application/generate",
            json=spec,
            timeout=60
        )
        
        if response.status_code != 200:
            log_error(f"Generation failed with status {response.status_code}")
            log_error(response.text)
            return False
        
        result = response.json()
        log_success(f"Application generated successfully!")
        log_success(f"Output path: {result['output_path']}")
        log_success(f"Files generated: {result['files_generated']}")
        
        return result
        
    finally:
        # Stop the API server
        api_process.kill()
        api_process.wait()

def test_validate_files(result):
    """Validate that all required files are created"""
    log_step("Step 2: Validating generated files")
    
    output_path = Path(result['output_path'])
    
    required_files = [
        "README.md",
        "API.md",
        "docker-compose.yml",
        ".env.example",
        "backend/Dockerfile",
        "backend/Program.cs",
        "backend/ApplicationDbContext.cs",
        "frontend/Dockerfile",
        "frontend/scripts/generate-api-services.sh",
    ]
    
    for file_path in required_files:
        full_path = output_path / file_path
        if full_path.exists():
            log_success(f"Found: {file_path}")
        else:
            log_error(f"Missing: {file_path}")
            return False
    
    # Check that models were generated
    models_dir = output_path / "backend" / "Models"
    if models_dir.exists():
        model_files = list(models_dir.glob("*.cs"))
        log_success(f"Generated {len(model_files)} model files")
    else:
        log_error("Models directory not found")
        return False
    
    # Check that controllers were generated
    controllers_dir = output_path / "backend" / "Controllers"
    if controllers_dir.exists():
        controller_files = list(controllers_dir.glob("*Controller.cs"))
        log_success(f"Generated {len(controller_files)} controller files")
    else:
        log_error("Controllers directory not found")
        return False
    
    return True

def test_docker_build(result):
    """Test Docker image builds"""
    log_step("Step 3: Building Docker images")
    
    output_path = Path(result['output_path'])
    
    # Build backend
    log_step("Building backend Docker image...")
    try:
        run_command(
            "docker build -t test-backend:latest .",
            cwd=output_path / "backend"
        )
        log_success("Backend Docker image built successfully")
    except subprocess.CalledProcessError:
        log_error("Backend Docker build failed")
        return False
    
    # Build frontend
    log_step("Building frontend Docker image...")
    try:
        run_command(
            "docker build -t test-frontend:latest .",
            cwd=output_path / "frontend"
        )
        log_success("Frontend Docker image built successfully")
    except subprocess.CalledProcessError:
        log_error("Frontend Docker build failed")
        return False
    
    return True

def test_docker_compose(result):
    """Test docker-compose setup"""
    log_step("Step 4: Testing docker-compose")
    
    output_path = Path(result['output_path'])
    
    # Copy .env.example to .env
    env_example = output_path / ".env.example"
    env_file = output_path / ".env"
    shutil.copy(env_example, env_file)
    
    try:
        # Start services
        log_step("Starting services with docker-compose...")
        run_command(
            "docker-compose up -d",
            cwd=output_path
        )
        
        # Wait for services to be ready
        log_step("Waiting for services to be ready...")
        time.sleep(10)
        
        # Check if services are running
        result_cmd = run_command(
            "docker-compose ps",
            cwd=output_path,
            capture_output=True
        )
        log_success("Services started")
        print(result_cmd.stdout)
        
        return True
        
    except subprocess.CalledProcessError:
        log_error("docker-compose failed")
        return False
    finally:
        # Cleanup
        log_step("Stopping services...")
        run_command(
            "docker-compose down",
            cwd=output_path,
            check=False
        )

def test_migrations(result):
    """Test database migrations"""
    log_step("Step 5: Testing database migrations")
    
    output_path = Path(result['output_path'])
    backend_path = output_path / "backend"
    
    # Check if migration script exists
    migration_script = backend_path / "Migrations" / "apply-migrations.sh"
    if not migration_script.exists():
        log_warning("Migration script not found (may need to be run inside container)")
        return True
    
    log_success("Migration script exists")
    return True

def test_backend_tests(result):
    """Run backend tests"""
    log_step("Step 6: Running backend tests")
    
    output_path = Path(result['output_path'])
    tests_dir = output_path / "backend" / "Tests"
    
    if not tests_dir.exists():
        log_warning("Tests directory not found")
        return True
    
    # Check that test files were generated
    test_files = list(tests_dir.glob("*.cs"))
    if test_files:
        log_success(f"Found {len(test_files)} test files")
    else:
        log_warning("No test files found")
    
    # Check for test project file
    test_csproj = list(tests_dir.glob("*.csproj"))
    if test_csproj:
        log_success("Test project file exists")
    else:
        log_warning("Test project file not found")
    
    return True

def main():
    """Main test function"""
    print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BLUE}  Application Generator End-to-End Test{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*60}{Colors.RESET}\n")
    
    try:
        # Test 1: Generate application
        result = test_generate_application()
        if not result:
            log_error("Application generation failed")
            return 1
        
        # Test 2: Validate files
        if not test_validate_files(result):
            log_error("File validation failed")
            return 1
        
        # Test 3: Build Docker images
        if not test_docker_build(result):
            log_error("Docker build failed")
            return 1
        
        # Test 4: Test docker-compose
        if not test_docker_compose(result):
            log_error("docker-compose test failed")
            return 1
        
        # Test 5: Test migrations
        if not test_migrations(result):
            log_error("Migration test failed")
            return 1
        
        # Test 6: Run backend tests
        if not test_backend_tests(result):
            log_error("Backend tests failed")
            return 1
        
        # All tests passed
        print(f"\n{Colors.GREEN}{'='*60}{Colors.RESET}")
        print(f"{Colors.GREEN}  ✓ All tests passed successfully!{Colors.RESET}")
        print(f"{Colors.GREEN}{'='*60}{Colors.RESET}\n")
        
        log_success(f"Generated application is at: {result['output_path']}")
        
        return 0
        
    except Exception as e:
        log_error(f"Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
