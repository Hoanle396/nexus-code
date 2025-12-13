"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Copy,
  CheckCircle2,
  Github,
  GitBranch,
  Webhook,
  Shield,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface WebhookSetupGuideProps {
  trigger?: React.ReactNode;
}

export function WebhookSetupGuide({ trigger }: WebhookSetupGuideProps) {
  const [open, setOpen] = useState(false);
  const [copiedText, setCopiedText] = useState<string>("");
  const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL || "https://your-api-url.com"}/webhook`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  return (
    <>
      {trigger ? (
        <div onClick={handleOpen} className="inline cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpen}
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Webhook Setup Guide
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex flex-col max-w-7xl h-[90vh] overflow-hidden" onClose={() => setOpen(false)}>
          <DialogHeader className="flex-shrink-0 bg-zinc-900 pb-6 pt-6 px-6 sm:px-8 border-b border-zinc-800/50">
            <DialogTitle className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center border border-blue-500/30 shadow-lg shadow-blue-500/10">
                <Webhook className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white mb-1">Webhook Setup Guide</div>
                <div className="text-sm text-zinc-400 font-normal">Configure webhook to enable AI-powered code reviews</div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 sm:py-8">
            <Tabs defaultValue="github" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger
                  value="github"
                  className="data-[state=active]:bg-zinc-700"
                >
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </TabsTrigger>
                <TabsTrigger
                  value="gitlab"
                  className="data-[state=active]:bg-zinc-700"
                >
                  <GitBranch className="h-4 w-4 mr-2" />
                  GitLab
                </TabsTrigger>
              </TabsList>

              {/* GitHub Setup */}
              <TabsContent value="github" className="space-y-5">
                {/* Webhook URL Section */}
                <div className="bg-gradient-to-br from-zinc-800/40 to-zinc-800/20 border border-zinc-700/70 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
                      <span className="text-blue-400 font-bold">1</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">Copy Webhook URL</h3>
                  </div>
                  <div className="flex gap-2">
                    <code className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-blue-300 font-mono break-all">
                      {webhookUrl}/github
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(`${webhookUrl}/github`, "GitHub Webhook URL")
                      }
                      className="border-zinc-700 hover:bg-zinc-800 flex-shrink-0"
                    >
                      {copiedText === "GitHub Webhook URL" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                  {/* Step 2 */}
                  <div className="bg-gradient-to-br from-zinc-800/40 to-zinc-800/20 border border-zinc-700/70 rounded-xl p-6 shadow-lg hover:border-zinc-600/70 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
                        <span className="text-blue-400 font-bold">2</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-white mb-2">
                          Navigate to Repository Settings
                        </h4>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          Go to your GitHub repository → <span className="text-zinc-300 font-medium">Settings</span> → <span className="text-zinc-300 font-medium">Webhooks</span> → <span className="text-zinc-300 font-medium">Add webhook</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-gradient-to-br from-zinc-800/40 to-zinc-800/20 border border-zinc-700/70 rounded-xl p-6 shadow-lg hover:border-zinc-600/70 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
                        <span className="text-blue-400 font-bold">3</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-white mb-3">
                          Configure Webhook Settings
                        </h4>
                        <div className="space-y-3">
                          <div className="bg-zinc-900/50 border border-zinc-700 rounded p-3">
                            <div className="text-xs text-zinc-500 mb-1">Payload URL</div>
                            <div className="text-sm text-zinc-200 font-mono">{webhookUrl}/github</div>
                          </div>
                          <div className="bg-zinc-900/50 border border-zinc-700 rounded p-3">
                            <div className="text-xs text-zinc-500 mb-1">Content type</div>
                            <div className="text-sm text-zinc-200">application/json</div>
                          </div>
                          <div className="bg-zinc-900/50 border border-zinc-700 rounded p-3">
                            <div className="text-xs text-zinc-500 mb-1">Secret</div>
                            <div className="text-sm text-zinc-400 italic">Leave empty (optional for now)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-gradient-to-br from-zinc-800/40 to-zinc-800/20 border border-zinc-700/70 rounded-xl p-6 shadow-lg hover:border-zinc-600/70 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
                        <span className="text-blue-400 font-bold">4</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-white mb-2">
                          Select Events to Trigger
                        </h4>
                        <p className="text-sm text-zinc-400 mb-3">
                          Choose <span className="text-zinc-300 font-medium">"Let me select individual events"</span> and check these:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="flex items-center gap-2 px-3 py-2.5 bg-green-500/5 border border-green-500/20 rounded">
                            <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                            <span className="text-zinc-200 text-sm">Pull requests</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2.5 bg-green-500/5 border border-green-500/20 rounded">
                            <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                            <span className="text-zinc-200 text-sm">Pull request reviews</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2.5 bg-green-500/5 border border-green-500/20 rounded">
                            <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                            <span className="text-zinc-200 text-sm">PR review comments</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2.5 bg-green-500/5 border border-green-500/20 rounded">
                            <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                            <span className="text-zinc-200 text-sm">Issue comments</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="bg-gradient-to-br from-green-500/15 to-emerald-500/10 border border-green-500/40 rounded-xl p-6 shadow-xl hover:border-green-500/60 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/25 flex items-center justify-center flex-shrink-0 border border-green-500/40">
                        <span className="text-green-400 font-bold">5</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-white mb-2">
                          Save & Test Connection
                        </h4>
                        <p className="text-sm text-zinc-300 leading-relaxed">
                          Click <span className="text-white font-medium">"Add webhook"</span>. GitHub will send a ping event to verify the connection.
                          Then create a test PR to see AI reviews in action! 🚀
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Important Note */}
                <div className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-300 mb-1">
                      ⚠️ Important Requirements
                    </p>
                    <ul className="text-sm text-amber-200/90 space-y-1 list-disc list-inside">
                      <li>Repository must have Pull Requests enabled</li>
                      <li>Bot user needs write access to post comments</li>
                      <li>Ensure webhook URL is accessible from GitHub</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              {/* GitLab Setup */}
              <TabsContent value="gitlab" className="space-y-5">
                {/* Webhook URL Section */}
                <div className="bg-gradient-to-br from-zinc-800/40 to-zinc-800/20 border border-zinc-700/70 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center flex-shrink-0 border border-orange-500/30">
                      <span className="text-orange-400 font-bold">1</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">Copy Webhook URL</h3>
                  </div>
                  <div className="flex gap-2">
                    <code className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-orange-300 font-mono break-all">
                      {webhookUrl}/gitlab
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(`${webhookUrl}/gitlab`, "GitLab Webhook URL")
                      }
                      className="border-zinc-700 hover:bg-zinc-800 flex-shrink-0"
                    >
                      {copiedText === "GitLab Webhook URL" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                  {/* Step 2 */}
                  <div className="bg-gradient-to-br from-zinc-800/40 to-zinc-800/20 border border-zinc-700/70 rounded-xl p-6 shadow-lg hover:border-zinc-600/70 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center flex-shrink-0 border border-orange-500/30">
                        <span className="text-orange-400 font-bold">2</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-white mb-2">
                          Navigate to Project Settings
                        </h4>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          Go to your GitLab project → <span className="text-zinc-300 font-medium">Settings</span> → <span className="text-zinc-300 font-medium">Webhooks</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-gradient-to-br from-zinc-800/40 to-zinc-800/20 border border-zinc-700/70 rounded-xl p-6 shadow-lg hover:border-zinc-600/70 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center flex-shrink-0 border border-orange-500/30">
                        <span className="text-orange-400 font-bold">3</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-white mb-3">
                          Configure Webhook Settings
                        </h4>
                        <div className="space-y-3">
                          <div className="bg-zinc-900/50 border border-zinc-700 rounded p-3">
                            <div className="text-xs text-zinc-500 mb-1">URL</div>
                            <div className="text-sm text-zinc-200 font-mono">{webhookUrl}/gitlab</div>
                          </div>
                          <div className="bg-zinc-900/50 border border-zinc-700 rounded p-3">
                            <div className="text-xs text-zinc-500 mb-1">Secret Token</div>
                            <div className="text-sm text-zinc-400 italic">Leave empty (optional for now)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-gradient-to-br from-zinc-800/40 to-zinc-800/20 border border-zinc-700/70 rounded-xl p-6 shadow-lg hover:border-zinc-600/70 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center flex-shrink-0 border border-orange-500/30">
                        <span className="text-orange-400 font-bold">4</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-white mb-2">
                          Select Trigger Events
                        </h4>
                        <p className="text-sm text-zinc-400 mb-3">
                          Enable these triggers in the <span className="text-zinc-300 font-medium">Trigger</span> section:
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 px-3 py-2.5 bg-green-500/5 border border-green-500/20 rounded">
                            <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                            <span className="text-zinc-200 text-sm">Merge request events</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2.5 bg-green-500/5 border border-green-500/20 rounded">
                            <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                            <span className="text-zinc-200 text-sm">Comments</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="bg-gradient-to-br from-zinc-800/40 to-zinc-800/20 border border-zinc-700/70 rounded-xl p-6 shadow-lg hover:border-zinc-600/70 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center flex-shrink-0 border border-orange-500/30">
                        <span className="text-orange-400 font-bold">5</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-white mb-2">
                          Enable SSL Verification
                        </h4>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          Check <span className="text-zinc-300 font-medium">"Enable SSL verification"</span> for production environments to ensure secure communication
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 6 */}
                  <div className="bg-gradient-to-br from-green-500/15 to-emerald-500/10 border border-green-500/40 rounded-xl p-6 shadow-xl hover:border-green-500/60 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/25 flex items-center justify-center flex-shrink-0 border border-green-500/40">
                        <span className="text-green-400 font-bold">6</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-white mb-2">
                          Add Webhook & Test Connection
                        </h4>
                        <p className="text-sm text-zinc-300 leading-relaxed">
                          Click <span className="text-white font-medium">"Add webhook"</span>, then use the <span className="text-white font-medium">"Test"</span> button to verify.
                          Create a test MR to see AI reviews in action! 🚀
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Important Note */}
                <div className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-300 mb-1">
                      ⚠️ Important Requirements
                    </p>
                    <ul className="text-sm text-amber-200/90 space-y-1 list-disc list-inside">
                      <li>Bot user needs at least Developer role in the project</li>
                      <li>Ensure webhook URL is accessible from GitLab</li>
                      <li>Test the webhook after configuration</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Security Best Practices */}
            <div className="mt-6 bg-gradient-to-br from-blue-500/15 to-cyan-500/10 border border-blue-500/30 rounded-xl p-6 shadow-xl">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center flex-shrink-0 border border-blue-500/30 shadow-lg shadow-blue-500/10">
                  <Shield className="h-6 w-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-blue-300 mb-3">
                    🔒 Security Best Practices
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-zinc-300">Use webhook secrets in production</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-zinc-300">Restrict bot to minimum permissions</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-zinc-300">Monitor webhook delivery logs</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-zinc-300">Never commit API tokens to repo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
