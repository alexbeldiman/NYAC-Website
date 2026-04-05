# Tools

Python scripts for deterministic execution. Each tool:
- Does one thing well
- Reads inputs from args or stdin
- Writes outputs to stdout or files
- Fails loudly with clear error messages

## Adding a new tool
1. Create `tool_name.py` in this directory
2. Add a docstring explaining what it does and expected inputs/outputs
3. Reference it in the relevant workflow(s)
