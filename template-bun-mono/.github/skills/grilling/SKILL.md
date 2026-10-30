---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

# grilling

Interview the user relentlessly until you reach a shared understanding. Map this as a design tree: every decision branches into the decisions that hang off it.

Work the tree in rounds. The frontier is every decision whose prerequisites are already settled - the questions you can ask now without guessing at answers you haven't heard yet. Ask only questions on the current frontier. Recompute the frontier as the user's answers settle decisions and unblock later questions.

## Interactive questions

When running as a VS Code Copilot custom agent, use the interactive
`vscode_askQuestions` tool to ask the user directly instead of posting questions as plain
chat text. The agent definition must include `vscode_askQuestions` in its `tools` frontmatter.
Reference it explicitly as `#tool:vscode_askQuestions` when needed.

- Ask one question per tool call and wait for the user's answer before asking the next question.
- Use the tool's choices for predictable alternatives. Put your recommended answer first and
  mark it `(Recommended)`. Do not add an "Other" or catch-all choice; the tool provides a
  free-text option.
- Use a free-text question without choices only when the answer cannot reasonably be
  predicted.
- Ask only the next decision on the frontier. If the answer changes the tree, recompute it
  before asking anything else.
- Do not also repeat the interactive question in plain chat text.

If the tool is genuinely unavailable in the active runtime, return the next question to the
coordinating agent in a ready-to-ask format: question title, question body, choices (if
appropriate), and recommended answer. The coordinator should use its interactive question
tool to relay it when available, then pass the user's answer back to you. If no interactive
question tool is available to either agent, use the plain-text fallback format below.

## Plain-text fallback

Only use this format when no interactive user-question tool is available:

❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

In the fallback, ask all independent questions on the current frontier in one numbered
message, then wait for the user's answers before the next round. A question whose answer
depends on another open question belongs to a later round.

Finding facts is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it - don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report - ask the rest of the frontier now. The decisions are the user's - put each to them and wait.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.
