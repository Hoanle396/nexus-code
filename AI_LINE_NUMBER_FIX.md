# Fix: AI Comment Sai Line Number

## Vấn đề

AI đang comment vào line number không chính xác trong Pull Request. Điều này xảy ra vì:

1. **Thiếu mapping rõ ràng**: AI không có thông tin chính xác về line number nào tương ứng với code nào
2. **Prompt không đủ chi tiết**: AI phải tự suy luận line number từ git diff, dẫn đến sai lệch
3. **Validation không đủ mạnh**: Không có log chi tiết để debug khi có sai sót

## Giải pháp đã triển khai

### 1. Line Number Mapping Chi Tiết

**Trước:**
```typescript
const userPrompt = `
Review the following code changes from file: **${fileName}**
...
**Git Diff:**
\`\`\`diff
${codeSnippet}
\`\`\`
`;
```

**Sau:**
```typescript
// Parse diff và tạo mapping chính xác
const lineMapping = diffInfo.chunks.flatMap(chunk => {
  return chunk.lines
    .filter(l => l.type === 'add')
    .map(l => ({
      lineNumber: l.lineNumber,
      code: l.content,
      type: 'added'
    }));
});

const userPrompt = `
**CRITICAL - Line Number Mapping:**
Below is the EXACT mapping of line numbers to code in the NEW file (after changes).
You MUST use these EXACT line numbers when commenting:

${lineMapping.map(m => `Line ${m.lineNumber}: ${m.code}`).join('\n')}

**IMPORTANT Rules:**
- ONLY comment on lines that appear in the mapping above
- Use the EXACT line number from the mapping
- Always use "side": "RIGHT" (for new/added code)
- If a line number is NOT in the mapping above, DO NOT comment on it
`;
```

### 2. Enhanced Validation với Logging

**Trước:**
```typescript
response.lineComments = response.lineComments.filter(comment => {
  if (!diffInfo.addedLines.includes(comment.line)) {
    console.warn(`Skipping comment on line ${comment.line}`);
    return false;
  }
  return true;
});
```

**Sau:**
```typescript
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 Diff Analysis for:', fileName);
console.log('✅ Added lines (RIGHT side):', diffInfo.addedLines.length, 'lines');
console.log('   Valid line numbers:', diffInfo.addedLines.slice(0, 20).join(', '));
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🤖 AI returned', originalCommentCount, 'line comments:');
response.lineComments.forEach((c, idx) => {
  const isValid = validLineNumbersSet.has(c.line);
  console.log(`   ${idx + 1}. Line ${c.line} (${c.side}) ${isValid ? '✓' : '✗ INVALID'} - ${c.issue?.substring(0, 50)}...`);
});

response.lineComments = response.lineComments.filter(comment => {
  if (!validLineNumbersSet.has(comment.line)) {
    console.warn(`❌ REJECTED: Comment on line ${comment.line} - not in valid added lines`);
    console.warn(`   Issue: ${comment.issue}`);
    console.warn(`   Hint: Valid lines are: [${Array.from(validLineNumbersSet).slice(0, 10).join(', ')}...]`);
    return false;
  }
  console.log(`✅ ACCEPTED: Comment on line ${comment.line} - "${comment.issue?.substring(0, 60)}..."`);
  return true;
});

console.log(`📝 Final result: ${response.lineComments.length}/${originalCommentCount} comments validated successfully`);
```

### 3. Prompt Instructions Chi Tiết

Thêm các instructions rõ ràng hơn:

```typescript
**Your task:**
1. Review the code content shown in the "Line Number Mapping" section above
2. For each issue found, provide:
   - The EXACT line number from the mapping (e.g., if you see "Line 42: const user = await..." and find an issue, use line: 42)
   - side must ALWAYS be "RIGHT"
   - The severity level: error, warning, info, or suggestion
   - Description of the issue
   - The problematic code snippet (codeError) - copy from the mapping
   - Suggested fix or improvement (codeSuggest)
   - Complete comment body with emoji prefix

**CRITICAL REMINDER:**
- You can ONLY comment on line numbers that exist in the "Line Number Mapping" section
- Use the EXACT line numbers shown in that mapping
- Do NOT guess or calculate line numbers yourself
- Do NOT comment on lines not listed in the mapping
```

### 4. Example trong Response Format

Thêm example cụ thể:

```json
**Example:**
If the mapping shows:
  Line 42: const user = await userService.findById(id);
  Line 43: return user.data;

And you find an issue on line 43, your response should be:
{
  "lineComments": [
    {
      "line": 43,
      "side": "RIGHT",
      "severity": "error",
      "issue": "Potential null pointer - user.data might be undefined",
      "codeError": "return user.data;",
      "codeSuggest": "return user?.data ?? null;",
      "body": "🐛 Error: Potential null pointer - user.data might be undefined. Consider using optional chaining."
    }
  ]
}
```

## Kết quả

### Debug Output mẫu

Khi chạy, bạn sẽ thấy log như sau:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Diff Analysis for: src/user/user.service.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Added lines (RIGHT side): 5 lines
   Valid line numbers: 42, 43, 44, 45, 46
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI returned 3 line comments:
   1. Line 43 (RIGHT) ✓ - Potential null pointer - user.data might be undefin...
   2. Line 45 (RIGHT) ✓ - Missing error handling for async operation...
   3. Line 50 (RIGHT) ✗ INVALID - This line is not in the added lines...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ACCEPTED: Comment on line 43 - "Potential null pointer - user.data might be undefined..."
✅ ACCEPTED: Comment on line 45 - "Missing error handling for async operation..."
❌ REJECTED: Comment on line 50 - not in valid added lines
   Issue: This line is not in the added lines
   Hint: Valid lines are: [42, 43, 44, 45, 46...]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Final result: 2/3 comments validated successfully
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Lợi ích

1. **Chính xác hơn**: AI có mapping rõ ràng line number → code
2. **Dễ debug**: Log chi tiết giúp phát hiện vấn đề nhanh chóng
3. **Tự động filter**: Loại bỏ comments sai line number trước khi post
4. **Transparent**: Developer có thể thấy rõ quá trình validate

## Testing

Để test fix này:

1. Tạo một PR với một vài dòng thay đổi
2. Chờ AI review
3. Kiểm tra logs để xem:
   - Line numbers được parse đúng không
   - AI comment vào đúng lines không
   - Validation có reject comments sai không

## Files thay đổi

- `backend/src/modules/ai/ai.service.ts` - Main fix
  - Method `reviewCodeWithLineComments()` - Enhanced line mapping
  - Improved prompt with detailed instructions
  - Enhanced validation with comprehensive logging
