import { expect } from '@playwright/test';

export { expect };

export interface TestCase {
  id: string;
  name: string;
  fn: () => Promise<void> | void;
}

export interface TestSuite {
  name: string;
  tests: TestCase[];
  beforeAll?: () => Promise<void> | void;
  afterAll?: () => Promise<void> | void;
  beforeEach?: () => Promise<void> | void;
  afterEach?: () => Promise<void> | void;
}

export interface TestCaseResult {
  id: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: string;
}

export interface TestSuiteResult {
  name: string;
  passed: boolean;
  total: number;
  passedCount: number;
  failedCount: number;
  durationMs: number;
  results: TestCaseResult[];
}

export class SuiteBuilder {
  private suite: TestSuite;

  constructor(name: string) {
    this.suite = {
      name,
      tests: [],
    };
  }

  test(id: string, name: string, fn: () => Promise<void> | void): this {
    this.suite.tests.push({ id, name, fn });
    return this;
  }

  beforeAll(fn: () => Promise<void> | void): this {
    this.suite.beforeAll = fn;
    return this;
  }

  afterAll(fn: () => Promise<void> | void): this {
    this.suite.afterAll = fn;
    return this;
  }

  beforeEach(fn: () => Promise<void> | void): this {
    this.suite.beforeEach = fn;
    return this;
  }

  afterEach(fn: () => Promise<void> | void): this {
    this.suite.afterEach = fn;
    return this;
  }

  build(): TestSuite {
    return this.suite;
  }
}

export function defineSuite(name: string, configure: (builder: SuiteBuilder) => void): TestSuite {
  const builder = new SuiteBuilder(name);
  configure(builder);
  return builder.build();
}

export async function runSuite(suite: TestSuite): Promise<TestSuiteResult> {
  const startTime = Date.now();
  const results: TestCaseResult[] = [];

  if (suite.beforeAll) {
    try {
      await suite.beforeAll();
    } catch (err: any) {
      console.error(`[FATAL] beforeAll failed for suite ${suite.name}:`, err.message);
      return {
        name: suite.name,
        passed: false,
        total: suite.tests.length,
        passedCount: 0,
        failedCount: suite.tests.length,
        durationMs: Date.now() - startTime,
        results: suite.tests.map((t) => ({
          id: t.id,
          name: t.name,
          passed: false,
          durationMs: 0,
          error: `Suite beforeAll failed: ${err.message}`,
        })),
      };
    }
  }

  for (const t of suite.tests) {
    const testStart = Date.now();
    try {
      if (suite.beforeEach) await suite.beforeEach();
      await t.fn();
      if (suite.afterEach) await suite.afterEach();

      const durationMs = Date.now() - testStart;
      results.push({
        id: t.id,
        name: t.name,
        passed: true,
        durationMs,
        details: 'Assertion passed successfully',
      });
    } catch (err: any) {
      if (suite.afterEach) {
        try {
          await suite.afterEach();
        } catch {}
      }

      const durationMs = Date.now() - testStart;
      results.push({
        id: t.id,
        name: t.name,
        passed: false,
        durationMs,
        error: err.message || String(err),
      });
    }
  }

  if (suite.afterAll) {
    try {
      await suite.afterAll();
    } catch (err: any) {
      console.error(`[WARN] afterAll failed for suite ${suite.name}:`, err.message);
    }
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  return {
    name: suite.name,
    passed: failedCount === 0,
    total: results.length,
    passedCount,
    failedCount,
    durationMs: Date.now() - startTime,
    results,
  };
}
