import subprocess
res = subprocess.run(["node", "-c", "app.js"], capture_output=True, text=True)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
print("RETURN CODE:", res.returncode)
