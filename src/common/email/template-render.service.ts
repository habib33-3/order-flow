import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { Injectable, InternalServerErrorException } from "@nestjs/common";

import * as hbs from "handlebars";

import { env } from "../env/env";

@Injectable()
export class TemplateRenderService {
    private readonly rootPath = join(
        // eslint-disable-next-line n/prefer-global/process
        process.cwd(),
        "src",
        "common",
        "email",
        "template"
    );

    private readonly layoutPath = join(this.rootPath, "layouts", "main.hbs");

    private readonly globalContext = {
        brandName: env.APP_NAME,
        websiteUrl: env.CLIENT_URL,
        supportEmail: env.EMAIL_FROM_EMAIL,
    };

    private readFileOrThrow(filePath: string, errorMessage: string): string {
        if (!existsSync(filePath)) {
            throw new InternalServerErrorException(errorMessage);
        }

        return readFileSync(filePath, "utf-8");
    }

    private loadTemplate(templatePath: string): string {
        const filePath = join(this.rootPath, `${templatePath}.hbs`);

        return this.readFileOrThrow(
            filePath,
            `Template not found: ${templatePath}`
        );
    }

    private loadLayout(): string {
        return this.readFileOrThrow(this.layoutPath, "Main layout not found");
    }

    private compile(source: string, context: Record<string, unknown>): string {
        const compiled = hbs.compile(source);

        return compiled(context);
    }

    public renderTemplate(
        templatePath: string,
        context: Record<string, unknown>
    ): string {
        const bodySource = this.loadTemplate(templatePath);
        const layoutSource = this.loadLayout();

        const bodyHtml = this.compile(bodySource, context);

        return this.compile(layoutSource, {
            ...this.globalContext,
            ...context,
            body: bodyHtml,
        });
    }

    public buildTemplatePrefix(domain: string): (template: string) => string {
        return (template: string): string => `${domain}/${template}`;
    }
}
