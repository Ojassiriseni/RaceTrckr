import { RuleModule } from '@typescript-eslint/utils/ts-eslint';
import { ESLint } from 'eslint';
import { rules } from './rules';
type RuleKey = keyof typeof rules;
interface Plugin extends Omit<ESLint.Plugin, 'rules'> {
    rules: Record<RuleKey, RuleModule<any, any, any>>;
}
declare const plugin: Plugin;
export = plugin;
