class AiProvider < Formula
  desc "Manage multiple AI providers (Claude API, LiteLLM, Claude.ai) for Claude Code"
  homepage "https://github.com/MikeLeonFox/ai-provider-cli"
  url "https://github.com/MikeLeonFox/ai-provider-cli/archive/refs/tags/v1.0.0.tar.gz"
  sha256 "6ecb6f0fa9a03cf2c595825eff50589c0a66d45667c9bbfc93f980d07464fcf0" 
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install"
    system "npm", "run", "build"
    chmod 0755, "dist/index.js"
    libexec.install Dir["*"]
    (bin/"ai-provider").write <<~SH
      #!/bin/bash
      exec "#{Formula["node"].opt_bin}/node" "#{libexec}/dist/index.js" "$@"
    SH
  end

  test do
    assert_match "1.0.0", shell_output("#{bin}/ai-provider --version")
  end
end
