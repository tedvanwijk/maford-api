-- CreateTable
CREATE TABLE "tool_input_rules" (
    "tool_input_rule_id" SERIAL NOT NULL,
    "tool_input_id" INTEGER NOT NULL,
    "tool_input_dependency_id" INTEGER NOT NULL,
    "rule_type" TEXT NOT NULL,

    CONSTRAINT "tool_input_rules_pkey" PRIMARY KEY ("tool_input_rule_id")
);

-- AddForeignKey
ALTER TABLE "tool_input_rules" ADD CONSTRAINT "fk_tool_input_id" FOREIGN KEY ("tool_input_id") REFERENCES "tool_inputs"("tool_input_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tool_input_rules" ADD CONSTRAINT "fk_tool_input_dependency_id" FOREIGN KEY ("tool_input_dependency_id") REFERENCES "tool_inputs"("tool_input_id") ON DELETE CASCADE ON UPDATE NO ACTION;
