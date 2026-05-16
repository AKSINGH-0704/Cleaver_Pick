import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import StageStepper from './StageStepper';
import { stageEnter } from '../../utils/animations';

export default function PipelineVisualizer({
  activeStage = 0,
  statusMessage = '',
  stageData = {},
  stageComponents = {},
}) {
  const ActiveComponent = useMemo(
    () => stageComponents[activeStage] ?? null,
    [activeStage, stageComponents],
  );

  return (
    <div className="w-full space-y-4">
      <StageStepper activeStage={activeStage} statusMessage={statusMessage} />

      <div className="relative min-h-[260px]">
        <AnimatePresence mode="wait">
          {ActiveComponent && (
            <motion.div
              key={`stage-${activeStage}`}
              variants={stageEnter}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <ActiveComponent data={stageData} stage={activeStage} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
