# Email Template Style Guide

This document defines the styling system and reusable components available to all email templates.

All email templates are rendered inside the global:

```text
common/email/template/layouts/main.hbs
```

Child templates should contain **only the email-specific content**. The global layout automatically provides:

- Brand header
- Main content card
- Typography
- Global styles
- Responsive behavior
- Footer
- Website link
- Support contact

---

## 1. Template Structure

Email templates should follow this structure:

```text
common/
└── email/
    ├── dto/
    │   └── send-email.dto.ts
    ├── template/
    │   ├── layouts/
    │   │   └── main.hbs
    │   │
    │   ├── auth/
    │   │   ├── welcome.hbs
    │   │   ├── verify-email.hbs
    │   │   └── reset-password.hbs
    │   │
    │   └── order/
    │       ├── order-confirmation.hbs
    │       └── payment-success.hbs
    │
    ├── email.service.ts
    ├── template-render.service.ts
    └── email.module.ts
```

A child template is rendered inside:

```html
<div class="email-content">{{{body}}}</div>
```

Therefore, child templates **must not** contain:

- `<html>`
- `<head>`
- `<body>`
- `<style>`
- Header markup
- Footer markup

Only write the content that belongs inside the email card.

---

# 2. Basic Template

The simplest email template:

```html
<h1>Email Heading</h1>

<p>Hello {{name}},</p>

<p>This is the content of your email.</p>

<p>
    Best regards,<br />
    The {{brandName}} Team
</p>
```

---

# 3. Brand Colors

Use the following color system.

| Purpose            | Color           | Hex       |
| ------------------ | --------------- | --------- |
| Primary            | Blue            | `#2563eb` |
| Primary Light      | Light Blue      | `#eff6ff` |
| Heading            | Dark Gray       | `#111827` |
| Body Text          | Gray            | `#4b5563` |
| Secondary Text     | Light Gray      | `#6b7280` |
| Muted Text         | Very Light Gray | `#9ca3af` |
| Border             | Light Gray      | `#e5e7eb` |
| Email Background   | Off White       | `#f4f7fb` |
| Warning Background | Light Yellow    | `#fffbeb` |
| Warning Text       | Dark Orange     | `#92400e` |
| Warning Border     | Orange          | `#f59e0b` |
| Info Text          | Dark Blue       | `#1e40af` |

### Primary Color

Use `#2563eb` for:

- Primary buttons
- Important links
- Brand accents
- Call-to-action elements

Do not introduce random colors unless there is a strong semantic reason.

---

# 4. Typography

The global email layout uses:

```text
-apple-system
BlinkMacSystemFont
"Segoe UI"
Roboto
Helvetica
Arial
sans-serif
```

## Headings

Use `<h1>` for the main heading.

```html
<h1>Verify Your Email Address</h1>
```

Use `<h2>` for secondary sections.

```html
<h2>Order Details</h2>
```

### Rules

- Use one `<h1>` per email whenever possible.
- Use `<h2>` for major sections.
- Do not manually specify font sizes.
- Do not use inline font styling unless absolutely necessary.

The layout automatically applies:

```text
H1
28px
Bold
Dark Gray

H2
20px
Semi-bold
Dark Gray
```

On mobile, the main heading automatically becomes smaller.

---

# 5. Paragraphs

Use standard `<p>` elements for normal content.

```html
<p>Hello {{name}},</p>

<p>Your account has been successfully created.</p>
```

The layout automatically applies appropriate:

- Font size
- Line height
- Text color
- Spacing

Do not manually add:

```html
<br />
<br />
```

for spacing.

Use separate `<p>` elements instead.

---

# 6. Primary Button

Use the `.button-wrapper` and `.button` classes for primary actions.

```html
<div class="button-wrapper">
    <a href="{{verificationUrl}}" class="button"> Verify Email </a>
</div>
```

Use this for actions such as:

- Verify Email
- Reset Password
- View Order
- Complete Payment
- Confirm Account
- View Dashboard

### Example

```html
<div class="button-wrapper">
    <a href="{{resetPasswordUrl}}" class="button"> Reset Password </a>
</div>
```

### Rules

Use **one primary CTA** whenever possible.

Good:

```text
Verify Email
```

Avoid:

```text
Click Here
```

The button should clearly describe the action.

---

# 7. Informational Box

Use `.info-box` for helpful, non-critical information.

```html
<div class="info-box">
    <p>Your verification link will expire in 30 minutes.</p>
</div>
```

Use it for:

- Expiration information
- Important account information
- Helpful instructions
- Non-critical notices

Example:

```html
<div class="info-box">
    <p>For security reasons, this verification link can only be used once.</p>
</div>
```

---

# 8. Warning Box

Use `.warning-box` for warnings or security-related information.

```html
<div class="warning-box">
    <p>If you did not request this action, you can safely ignore this email.</p>
</div>
```

Use it for:

- Security warnings
- Unrecognized account activity
- Expiring links
- Important cautionary messages

Example:

```html
<div class="warning-box">
    <p>This password reset link will expire in 15 minutes.</p>
</div>
```

Do not use warning boxes for normal information.

---

# 9. Links

Use normal anchor elements for inline links.

```html
<p>
    You can access your account from the
    <a href="{{websiteUrl}}">website</a>.
</p>
```

The global stylesheet automatically applies the primary blue color.

For long URLs, use a separate paragraph:

```html
<p>
    If the button does not work, copy and paste the following URL into your
    browser:
</p>

<p>
    <a href="{{verificationUrl}}"> {{verificationUrl}} </a>
</p>
```

---

# 10. Strong Text

Use `<strong>` to emphasize important information.

```html
<p>
    Your order number is
    <strong>{{orderNumber}}</strong>.
</p>
```

Use it for:

- Order numbers
- User names
- Important dates
- Amounts
- Security codes

Avoid excessive use of bold text.

---

# 11. Recommended Email Structure

Most transactional emails should follow this structure:

```html
<h1>Clear Email Heading</h1>

<p>Hello {{name}},</p>

<p>Explain why the user is receiving this email.</p>

<p>Explain what the user should do next.</p>

<div class="button-wrapper">
    <a href="{{actionUrl}}" class="button"> Take Action </a>
</div>

<div class="info-box">
    <p>Add helpful information here.</p>
</div>

<p>If you have any questions, please contact our support team.</p>

<p>
    Best regards,<br />
    The {{brandName}} Team
</p>
```

---

# 12. Example: Verification Email

File:

```text
template/auth/verify-email.hbs
```

Content:

```html
<h1>Verify Your Email Address</h1>

<p>Hello {{name}},</p>

<p>
    Thanks for creating an account with {{brandName}}. Please verify your email
    address by clicking the button below.
</p>

<div class="button-wrapper">
    <a href="{{verificationUrl}}" class="button"> Verify Email </a>
</div>

<div class="warning-box">
    <p>This verification link will expire in {{expirationMinutes}} minutes.</p>
</div>

<p>
    If you did not create an account with {{brandName}}, you can safely ignore
    this email.
</p>

<p>
    Best regards,<br />
    The {{brandName}} Team
</p>
```

Context:

```ts
{
    name: "John",
    brandName: "My App",
    verificationUrl: "https://example.com/verify/abc123",
    expirationMinutes: 30,
}
```

---

# 13. Example: Password Reset Email

File:

```text
template/auth/reset-password.hbs
```

Content:

```html
<h1>Reset Your Password</h1>

<p>Hello {{name}},</p>

<p>We received a request to reset the password associated with your account.</p>

<div class="button-wrapper">
    <a href="{{resetPasswordUrl}}" class="button"> Reset Password </a>
</div>

<div class="warning-box">
    <p>
        This password reset link will expire in {{expirationMinutes}} minutes.
        If you did not request a password reset, you can safely ignore this
        email.
    </p>
</div>

<p>
    Best regards,<br />
    The {{brandName}} Team
</p>
```

---

# 14. Example: Order Confirmation

File:

```text
template/order/order-confirmation.hbs
```

Content:

```html
<h1>Order Confirmed</h1>

<p>Hello {{name}},</p>

<p>Thank you for your order. Your order has been successfully confirmed.</p>

<div class="info-box">
    <p>
        <strong>Order ID:</strong> {{orderId}}<br />
        <strong>Total:</strong> {{total}} {{currency}}
    </p>
</div>

<div class="button-wrapper">
    <a href="{{orderUrl}}" class="button"> View Order </a>
</div>

<p>We will notify you when your order status changes.</p>

<p>
    Best regards,<br />
    The {{brandName}} Team
</p>
```

---

# 15. Template Naming

Use descriptive names based on the business action.

Good:

```text
auth/verify-email.hbs
auth/reset-password.hbs
auth/welcome.hbs

order/order-confirmation.hbs
order/payment-success.hbs
order/payment-failed.hbs
```

Avoid generic names:

```text
email1.hbs
template.hbs
message.hbs
test.hbs
```

Use kebab-case for file names.

---

# 16. Template Context

Each template should receive only the data it actually needs.

Example:

```ts
{
    name: user.name,
    verificationUrl,
    expirationMinutes: 30,
    brandName,
}
```

Avoid passing large objects directly:

```ts
// Avoid
{
    user,
    order,
    payment,
}
```

Instead, pass only required properties:

```ts
{
    name: user.name,
    orderId: order.id,
    total: order.total,
}
```

This makes templates easier to understand and maintain.

---

# 17. Global Context

The following variables can be considered global layout variables:

```text
brandName
websiteUrl
supportEmail
subject
```

These are available to the parent layout.

Example:

```ts
{
    brandName: "My App",
    websiteUrl: "https://example.com",
    supportEmail: "support@example.com",
}
```

Template-specific variables should be added separately.

Example:

```ts
{
    name: "John",
    verificationUrl: "...",
    expirationMinutes: 30,
}
```

---

# 18. Email Design Rules

Follow these rules when creating new templates.

### Do

- Keep the design simple.
- Use one primary CTA.
- Keep paragraphs short.
- Use clear headings.
- Use the existing color system.
- Use the existing CSS classes.
- Make the main action obvious.
- Keep important information near the top.
- Use semantic HTML.
- Test on mobile.

### Do Not

- Add a new `<style>` block to child templates.
- Add a new color without a reason.
- Add a new button style.
- Add custom fonts.
- Add unnecessary animations.
- Use very large images.
- Put important information only inside images.
- Add `<html>`, `<head>`, or `<body>` tags.
- Duplicate the header or footer.
- Use excessive text.

---

# 19. Available CSS Classes

The global `main.hbs` layout currently provides these reusable classes:

| Class             | Purpose                             |
| ----------------- | ----------------------------------- |
| `.button-wrapper` | Centers and spaces a primary button |
| `.button`         | Primary CTA button                  |
| `.info-box`       | Informational notice                |
| `.warning-box`    | Warning/security notice             |
| `.brand`          | Brand name styling                  |
| `.brand-accent`   | Brand accent color                  |
| `.email-content`  | Main content container              |
| `.email-card`     | Main email card                     |
| `.email-footer`   | Footer container                    |
| `.footer-links`   | Footer links                        |
| `.footer-divider` | Footer separator                    |

Child templates should primarily use:

```text
.button-wrapper
.button
.info-box
.warning-box
```

The other classes are mainly controlled by the global layout.

---

# 20. Quick Template Checklist

Before adding a new email template, verify:

- [ ] Template is inside the correct domain folder.
- [ ] File name uses kebab-case.
- [ ] Template contains only child content.
- [ ] No `<html>` tag.
- [ ] No `<head>` tag.
- [ ] No `<body>` tag.
- [ ] No custom `<style>` block.
- [ ] Uses `<h1>` for the primary heading.
- [ ] Uses `<p>` for paragraphs.
- [ ] Uses `.button` for the primary CTA.
- [ ] Uses `.info-box` for helpful information.
- [ ] Uses `.warning-box` for warnings.
- [ ] Uses existing brand colors.
- [ ] Only required context variables are passed.
- [ ] Primary action is obvious.
- [ ] Content is mobile-friendly.
- [ ] Sensitive information is not unnecessarily exposed.

---

# 21. Standard Template Pattern

When creating a new email, start with:

```html
<h1>Your Email Heading</h1>

<p>Hello {{name}},</p>

<p>Explain the purpose of this email.</p>

<p>Explain what the user needs to do.</p>

<div class="button-wrapper">
    <a href="{{actionUrl}}" class="button"> Primary Action </a>
</div>

<div class="info-box">
    <p>Optional helpful information.</p>
</div>

<p>
    Best regards,<br />
    The {{brandName}} Team
</p>
```

This should be the default starting point for new transactional email templates.

---

## Design Philosophy

The email system follows a simple principle:

> **One global layout, reusable components, and content-specific child templates.**

The `main.hbs` file owns the visual system.

Child templates own the message.

Therefore, when the global design changes, update `main.hbs` once rather than modifying every email template individually.
