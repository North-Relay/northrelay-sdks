# NorthRelay Template Guide

## How Brand Themes Work

NorthRelay brand themes inject styling via **Handlebars template variables**, not CSS classes.
When you send an email with a `themeId`, the API renders your template HTML through Handlebars,
replacing `{{theme.*}}` variables with your brand theme's color/font values.

## Available Theme Variables

Use these in your template HTML as `{{theme.variableName}}`:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `{{theme.primaryColor}}` | Primary brand color | `#2563eb` |
| `{{theme.secondaryColor}}` | Secondary accent color | `#7c3aed` |
| `{{theme.accentColor}}` | CTA / button accent color | `#f59e0b` |
| `{{theme.bgColor}}` | Email background color | `#f8fafc` |
| `{{theme.cardBgColor}}` | Card / content area background | `#ffffff` |
| `{{theme.headingColor}}` | Heading text color | `#1e293b` |
| `{{theme.textColor}}` | Body text color | `#475569` |
| `{{theme.mutedColor}}` | Secondary / muted text color | `#94a3b8` |
| `{{theme.fontFamily}}` | Font family stack | `Inter, sans-serif` |
| `{{theme.borderRadius}}` | Card corner radius | `8px` |
| `{{theme.buttonRadius}}` | Button corner radius | `6px` |
| `{{theme.buttonStyle}}` | Button style: `filled`, `outline`, or `ghost` | `filled` |
| `{{theme.companyName}}` | Company name for headers/footers | `Acme Inc` |
| `{{theme.logoUrl}}` | Logo image URL | `https://...` |
| `{{theme.footerHtml}}` | Custom footer HTML block | `<p>© 2026...</p>` |

## Template Structure

Templates should be **body-only HTML** (not full `<!DOCTYPE>` documents).
NorthRelay wraps your template body before sending.

### Example Template HTML

```html
<div style="background:{{theme.bgColor}};padding:24px;font-family:{{theme.fontFamily}};">
  <div style="max-width:600px;margin:0 auto;">
    <!-- Header -->
    <div style="background:{{theme.primaryColor}};color:white;padding:20px;border-radius:{{theme.borderRadius}} {{theme.borderRadius}} 0 0;">
      <h1 style="margin:0;font-size:20px;">{{theme.companyName}}</h1>
    </div>

    <!-- Body -->
    <div style="background:{{theme.cardBgColor}};padding:24px;border-radius:0 0 {{theme.borderRadius}} {{theme.borderRadius}};">
      <h2 style="color:{{theme.headingColor}};margin:0 0 12px;">Welcome, {{name}}!</h2>
      <p style="color:{{theme.textColor}};line-height:1.6;">
        Your verification code is: <strong>{{code}}</strong>
      </p>
      <a href="{{verifyUrl}}" style="display:inline-block;background:{{theme.accentColor}};color:white;padding:12px 28px;border-radius:{{theme.buttonRadius}};text-decoration:none;font-weight:600;">
        Verify Email
      </a>
      <p style="color:{{theme.mutedColor}};font-size:12px;margin-top:20px;">
        This code expires in 15 minutes.
      </p>
    </div>

    <!-- Footer -->
    {{#if theme.footerHtml}}{{{theme.footerHtml}}}{{/if}}
  </div>
</div>
```

### Using with the SDK

```python
from northrelay import NorthRelay, CreateTemplateRequest

client = NorthRelay(api_key="nr_live_...")

# Create a template
template = await client.templates.create(
    CreateTemplateRequest(
        name="Welcome Email",
        subject="Welcome to {{theme.companyName}}, {{name}}!",
        html=template_html,  # HTML with {{theme.*}} variables
        variables=["name", "code", "verifyUrl"],
    )
)

# Send with a brand theme
response = await client.emails.send_template(
    template_id=template.id,
    to=[{"email": "user@example.com", "name": "John"}],
    variables={"name": "John", "code": "123456", "verifyUrl": "https://..."},
    theme_id="your-theme-id",
)
```

## Button Styles

The `buttonStyle` theme property controls button rendering:

- **`filled`** (default): Solid background with white text
- **`outline`**: Transparent background with colored border
- **`ghost`**: Transparent background, no border, colored text
