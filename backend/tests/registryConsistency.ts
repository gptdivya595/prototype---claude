import assert from "node:assert/strict";
import { moduleCatalog } from "../templates/moduleCatalog";
import {
  MODULE_IDS,
  SKILL_IDS,
  WORK_ARTIFACTS,
  WORK_ROLES,
  WORKFLOW_IDS,
} from "../templates/registries";
import { skillCatalog } from "../templates/skillCatalog";
import { workflows, workflowTemplates } from "../templates/workflows";

const moduleIds = new Set(MODULE_IDS);
const workflowIds = new Set(WORKFLOW_IDS);
const skillIds = new Set(SKILL_IDS);
const roleIds = new Set(WORK_ROLES);
const artifactIds = new Set(WORK_ARTIFACTS);

assert.equal(workflows.length, 11);
assert.equal(skillCatalog.length, 11);
assert.equal(workflowTemplates.length, 11);

for (const module of moduleCatalog) {
  assert.ok(moduleIds.has(module.id), `module ${module.id} must be canonical`);
}

for (const workflow of workflows) {
  assert.ok(workflowIds.has(workflow.id), `workflow ${workflow.id} must be canonical`);
  assert.ok(skillIds.has(workflow.skillId), `workflow skill ${workflow.skillId} must be canonical`);

  for (const moduleId of [...workflow.defaultModuleIds, ...workflow.optionalModuleIds]) {
    assert.ok(moduleIds.has(moduleId), `workflow ${workflow.id} references unknown module ${moduleId}`);
  }

  for (const role of workflow.supportedRoles) {
    assert.ok(roleIds.has(role), `workflow ${workflow.id} references unknown role ${role}`);
  }

  for (const artifact of workflow.supportedArtifacts) {
    assert.ok(artifactIds.has(artifact), `workflow ${workflow.id} references unknown artifact ${artifact}`);
  }
}

for (const skill of skillCatalog) {
  assert.ok(skillIds.has(skill.id), `skill ${skill.id} must be canonical`);
  assert.ok(workflowIds.has(skill.workflowId), `skill ${skill.id} references unknown workflow ${skill.workflowId}`);

  for (const moduleId of [...skill.defaultModuleIds, ...skill.optionalModuleIds]) {
    assert.ok(moduleIds.has(moduleId), `skill ${skill.id} references unknown module ${moduleId}`);
  }
}

for (const template of workflowTemplates) {
  assert.ok(workflowIds.has(template.id), `template ${template.id} must be canonical`);
  assert.ok(template.sections.some((section) => section.required), `template ${template.id} needs a required section`);
  assert.ok(template.validationCriteria.length > 0, `template ${template.id} needs validation criteria`);

  const sectionIds = template.sections.map((section) => section.id);
  assert.equal(sectionIds.length, new Set(sectionIds).size, `template ${template.id} has duplicate section IDs`);

  for (const moduleId of [...template.defaultModules, ...template.optionalModules]) {
    assert.ok(moduleIds.has(moduleId), `template ${template.id} references unknown module ${moduleId}`);
  }

  for (const section of template.sections) {
    if (section.moduleId) {
      assert.ok(moduleIds.has(section.moduleId), `section ${section.id} references unknown module ${section.moduleId}`);
    }
  }
}

console.log("Phase 9 registry consistency checks passed.");
