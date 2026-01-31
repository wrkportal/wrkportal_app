# Blog Installation Instructions

## 📦 Required Dependencies

Install these packages to enable the blog functionality:

```bash
npm install gray-matter react-markdown remark-gfm react-syntax-highlighter @types/react-syntax-highlighter
```

### Package Descriptions

- **gray-matter**: Parses frontmatter from markdown files
- **react-markdown**: Renders markdown as React components
- **remark-gfm**: Adds GitHub Flavored Markdown support (tables, strikethrough, etc.)
- **react-syntax-highlighter**: Syntax highlighting for code blocks
- **@types/react-syntax-highlighter**: TypeScript types

## 📁 Directory Structure

Create these directories if they don't exist:

```bash
mkdir -p content/blog
mkdir -p components/blog
```

## ✅ Verification

After installation, verify everything works:

1. **Check dependencies are installed:**
   ```bash
   npm list gray-matter react-markdown remark-gfm react-syntax-highlighter
   ```

2. **Verify files exist:**
   - `app/(marketing)/blog/page.tsx` - Blog listing page
   - `app/(marketing)/blog/[slug]/page.tsx` - Individual post page
   - `lib/blog/posts.ts` - Blog utilities
   - `components/blog/mdx-content.tsx` - Markdown renderer
   - `content/blog/example-post.mdx` - Example post

3. **Test the blog:**
   - Visit `http://localhost:3000/blog` (should show blog listing)
   - Visit `http://localhost:3000/blog/example-post` (should show example post)

## 🚀 Next Steps

1. Install dependencies (see above)
2. Create your first blog post in `content/blog/`
3. Test the blog pages
4. Update sitemap (already done in `app/sitemap.ts`)
5. Start writing SEO-optimized content!

## 📝 Quick Start

1. **Install dependencies:**
   ```bash
   npm install gray-matter react-markdown remark-gfm react-syntax-highlighter @types/react-syntax-highlighter
   ```

2. **Create your first post:**
   ```bash
   # Copy the example
   cp content/blog/example-post.mdx content/blog/my-first-post.mdx
   
   # Edit with your content
   ```

3. **View your blog:**
   - Development: `http://localhost:3000/blog`
   - Production: `https://www.wrkportal.com/blog`

## ⚠️ Troubleshooting

### Error: "Cannot find module 'gray-matter'"
**Solution:** Run `npm install gray-matter`

### Error: "Cannot find module 'react-markdown'"
**Solution:** Run `npm install react-markdown remark-gfm`

### Blog page shows "No blog posts yet"
**Solution:** 
- Check that `content/blog/` directory exists
- Verify you have `.mdx` or `.md` files in the directory
- Check file permissions

### Syntax highlighting not working
**Solution:** 
- Ensure `react-syntax-highlighter` is installed
- Check browser console for errors
- Verify code blocks use proper language tags (e.g., ```javascript)

### Images not loading
**Solution:**
- Place images in `public/images/blog/` directory
- Use absolute paths starting with `/images/blog/`
- Ensure images are optimized (< 200KB)

## 📚 Additional Resources

- See `BLOG_SETUP_GUIDE.md` for detailed writing instructions
- See `content/blog/example-post.mdx` for post template
- Check Next.js docs for markdown rendering: https://nextjs.org/docs

---

**Need help?** Check the example post and setup guide for reference.
