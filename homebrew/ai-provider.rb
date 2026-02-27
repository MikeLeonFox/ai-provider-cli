class AiProvider < Formula
  desc "Manage multiple AI providers (Claude API, LiteLLM, Claude.ai) for Claude Code"
  homepage "https://github.com/GITHUB_USERNAME/ai-provider-cli"
  url "https://github.com/GITHUB_USERNAME/ai-provider-cli/archive/refs/tags/v1.0.0.tar.gz"
  sha256 "FILL_IN_AFTER_RELEASE" # see instructions below
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
