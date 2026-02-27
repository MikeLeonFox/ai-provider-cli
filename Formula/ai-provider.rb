class AiProvider < Formula
  desc "Manage multiple AI providers (Claude API, LiteLLM, Claude.ai) for Claude Code"
  homepage "https://github.com/MikeLeonFox/ai-provider-cli"
  url "https://github.com/MikeLeonFox/ai-provider-cli/archive/refs/tags/v1.0.0.tar.gz"
  sha256 "fb654f36122573414dfe3b98c880f6a8fd29f8a42e3d8ca547b24ca903cc2dbb"
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
