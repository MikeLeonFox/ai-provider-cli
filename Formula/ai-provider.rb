class AiProvider < Formula
  desc "Manage multiple AI providers (Claude API, LiteLLM, Claude.ai) for Claude Code"
  homepage "https://github.com/MikeLeonFox/ai-provider-cli"
  url "https://github.com/MikeLeonFox/ai-provider-cli/archive/refs/tags/v1.0.1.tar.gz"
  sha256 "80974fa3eca2456770f218c9cc99a66513f0821b6fb6b3309464fd9f1b4e1d68"
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
    assert_match "1.0.1", shell_output("#{bin}/ai-provider --version")
  end
end
