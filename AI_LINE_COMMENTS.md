# AI Line Comments Feature (RabbitCode AI Style)

## Tổng quan

Tính năng này cho phép AI comment trực tiếp vào các dòng code cụ thể trong Pull Request, tương tự như RabbitCode AI. Thay vì chỉ comment tổng quát, AI sẽ:

- Phân tích từng dòng code trong diff
- Comment trực tiếp vào dòng code có vấn đề
- Cung cấp severity level (error, warning, info, suggestion)
- Đưa ra feedback cụ thể và hành động được

## Kiến trúc

### 1. AI Service (`ai.service.ts`)

#### Interfaces mới

```typescript
export interface LineComment {
  path: string;           // Đường dẫn file
  line: number;           // Số dòng trong file
  side: 'RIGHT' | 'LEFT'; // RIGHT = new code (+), LEFT = old code (-)
  body: string;           // Nội dung comment
  startLine?: number;     // Dòng bắt đầu (cho multi-line comment)
  severity?: 'error' | 'warning' | 'info' | 'suggestion';
}

export interface ReviewResult {
  summary: string;              // Tóm tắt review
  lineComments: LineComment[];  // Danh sách inline comments
  overallFeedback: string;      // Feedback tổng quan
}
```

#### Methods mới

**`reviewCodeWithLineComments(context: CodeReviewContext): Promise<ReviewResult>`**

- Phân tích code diff và tạo inline comments cho từng dòng
- Sử dụng AI để phát hiện issues cụ thể
- Trả về structured result với line-by-line comments

**`parseDiff(diff: string)`**

- Parse git diff để extract thông tin về line numbers
- Phân biệt added lines (+) và deleted lines (-)
- Tạo chunks để track context

**`buildLineCommentSystemPrompt()`**

- Tạo system prompt chuyên biệt cho line-based review
- Hướng dẫn AI comment theo style của RabbitCode AI
- Yêu cầu response format JSON structured

**`callAiApiForStructuredReview()`**

- Gọi AI API với yêu cầu JSON structured output
- Parse và validate response
- Handle errors gracefully

## Workflow

### Pull Request Review Flow

```
1. Webhook nhận PR event (opened/synchronize)
   ↓
2. Fetch file diffs từ GitHub/GitLab
   ↓
3. Cho mỗi file có patch/diff:
   ├─→ Gọi reviewCodeWithLineComments()
   │   ├─→ Parse diff để lấy line numbers
   │   ├─→ AI phân tích và tạo line comments
   │   └─→ Return ReviewResult
   │
   ├─→ Post inline comments lên GitHub/GitLab
   │   └─→ Sử dụng pulls.createReviewComment() API
   │
   └─→ Post summary comment (nếu có issues)
```

### Line Comment Creation Flow

```
AI Analysis
   ↓
Identify issue on specific line
   ↓
Create LineComment object
{
  path: "src/user/user.service.ts",
  line: 42,
  side: "RIGHT",
  body: "🐛 Bug: Potential null pointer exception...",
  severity: "error"
}
   ↓
Post to GitHub/GitLab
   ↓
Save to database
```

## GitHub API Integration

### Create Review Comment

```typescript
await octokit.pulls.createReviewComment({
  owner,
  repo,
  pull_number: prNumber,
  body: comment.body,
  path: comment.path,
  line: comment.line,
  side: comment.side,  // 'RIGHT' for new code
  commit_id: commitSha,
});
```

### Parameters
- `path`: File path relative to repo root
- `line`: Line number in the diff
- `side`: 'RIGHT' (new code) or 'LEFT' (old code)
- `commit_id`: SHA of the commit being reviewed

## GitLab API Integration

### Create Discussion on Line

```typescript
await api.MergeRequestDiscussions.create(
  projectId,
  mergeRequestIid,
  comment.body,
  {
    position: {
      base_sha: baseSha,
      start_sha: startSha,
      head_sha: headSha,
      position_type: 'text',
      new_path: comment.path,
      new_line: comment.line,
      old_path: comment.path,
      old_line: comment.side === 'LEFT' ? comment.line : null,
    },
  },
);
```

## AI Prompt Strategy

### System Prompt

AI được hướng dẫn:
- Phân tích code line-by-line
- Chỉ comment khi có real issues
- Provide exact line numbers
- Use severity levels appropriately
- Include emoji prefixes (🐛 bugs, ⚠️ warnings, 💡 suggestions, etc.)

### User Prompt

Cung cấp cho AI:
- Complete git diff with line numbers
- PR context (title, description)
- File status (added/modified/renamed)
- Business context & review rules

### Response Format

AI trả về JSON:
```json
{
  "summary": "Brief overview of issues found",
  "lineComments": [
    {
      "line": 42,
      "side": "RIGHT",
      "severity": "error",
      "body": "🐛 Bug: Detailed explanation..."
    }
  ],
  "overallFeedback": "General assessment..."
}
```

## Comment Severity Levels

| Severity | Icon | Use Case | Example |
|----------|------|----------|---------|
| `error` | 🐛 | Bugs, logic errors | Null pointer, infinite loop |
| `warning` | ⚠️ | Code smells, potential issues | Missing validation, deprecated API |
| `info` | 📝 | Business logic concerns | Doesn't match requirements |
| `suggestion` | 💡 | Improvements, best practices | Use const instead of let |

## Database Schema

### ReviewComment Entity

```typescript
{
  id: uuid,
  reviewId: uuid,
  externalCommentId: string,
  type: CommentType.AI_GENERATED,
  content: string,
  filePath: string,
  lineNumber: number,  // ← Line number trong file
  metadata: {
    severity: 'error' | 'warning' | 'info' | 'suggestion',
    side: 'RIGHT' | 'LEFT'
  },
  createdAt: timestamp
}
```

## Example Output

### Inline Comment on Line 42

```
🐛 Bug: Potential null pointer exception

The `user` object may be null here. Consider adding null check:

```typescript
if (!user) {
  throw new Error('User not found');
}
```
```

### Summary Comment

```markdown
## 🤖 AI Code Review Summary

Found 3 issues in this PR that need attention.

**Details:** 3 inline comments added.

**Overall:** The code structure is good, but there are a few potential bugs that should be fixed before merging. Pay special attention to error handling in the user service.
```

## Benefits vs Traditional Comments

| Feature | Traditional | Line Comments (RabbitCode style) |
|---------|-------------|----------------------------------|
| Precision | File-level or general | Exact line number |
| Context | Limited | Full diff context |
| Actionable | Sometimes vague | Specific to code location |
| Developer UX | Need to search | Click to see issue |
| Integration | Basic | Native GitHub/GitLab UI |

## Error Handling

### Fallback Strategy

Nếu line comment fails:
1. Log error
2. Fall back to general comment với format:
   ```
   **src/user/user.service.ts:42**
   
   🐛 Bug: [Original comment body]
   ```

### Validation

- Validate line numbers từ diff
- Ensure comments chỉ trên changed lines
- Handle deleted files gracefully
- Check commit SHA validity

## Configuration

### Project Settings

```typescript
{
  autoReview: true,           // Enable auto review
  businessContext: string,    // Business context for AI
  reviewRules: object,        // Custom review rules
  // ... other settings
}
```

### Environment Variables

```
OPENROUTER_API_KEY=xxx    # AI API key
GITHUB_TOKEN=xxx          # GitHub access
GITLAB_TOKEN=xxx          # GitLab access
```

## Future Enhancements

1. **Multi-line comments**: Support commenting on code blocks
2. **Suggested fixes**: AI provides code suggestions directly
3. **Comment threading**: Reply to specific line comments
4. **Review approval**: AI can approve PRs if no issues
5. **Custom severity levels**: Project-specific severity definitions
6. **Batch review**: Review multiple files in parallel
7. **Learning from feedback**: Train AI from user corrections

## Testing

### Test Scenarios

1. ✅ Comment on added lines (+)
2. ✅ Comment on deleted lines (-)
3. ✅ Handle large diffs (>1000 lines)
4. ✅ Handle binary files gracefully
5. ✅ Fallback when line comment fails
6. ✅ Parse multi-chunk diffs
7. ✅ Handle renamed files
8. ✅ JSON response validation

### Mock Data

See `test/fixtures/sample-diff.txt` for test diffs.

## Troubleshooting

### Common Issues

**Issue**: Line comments không xuất hiện
- **Cause**: Commit SHA không match
- **Solution**: Verify commitSha từ webhook payload

**Issue**: "Invalid line number" error
- **Cause**: Line number không trong diff range
- **Solution**: Validate line numbers từ parsed diff

**Issue**: AI trả về invalid JSON
- **Cause**: Model hallucination
- **Solution**: Use lower temperature, add validation

## Performance

- Average review time: 5-15s per file
- API calls: 1 per file
- Token usage: ~2000-5000 tokens per file
- Rate limits: Handle GitHub/GitLab API limits

## Security

- Never expose API keys in comments
- Sanitize user input before AI processing
- Validate all line numbers
- Check permissions before posting comments

## References

- [GitHub Review Comments API](https://docs.github.com/en/rest/pulls/comments)
- [GitLab Discussions API](https://docs.gitlab.com/ee/api/discussions.html)
- [RabbitCode AI](https://rabbitcode.ai)
