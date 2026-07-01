import { spawn } from 'child_process';

function runScheduler(classFilter) {
  return new Promise((resolve) => {
    console.log(`\n\n======================================================`);
    console.log(`Starting scheduler for Class ${classFilter}...`);
    console.log(`======================================================\n\n`);
    
    const child = spawn('node', ['src/content-pipeline/scheduler.js', '--class', classFilter], {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      console.log(`\nScheduler for Class ${classFilter} exited with code ${code}`);
      if (code === 0) {
        resolve(true); // Completed cleanly
      } else if (code === 2) {
        console.log(`Scheduler finished but had failed tasks. Restarting to force retry...`);
        setTimeout(() => {
          resolve(false); 
        }, 5000);
      } else {
        // Did not complete cleanly (e.g. fatal rate limit or crash). Retry after delay.
        console.log(`Scheduler exited abnormally or threw a fatal limit error. Waiting 10 seconds before resuming...`);
        setTimeout(() => {
          resolve(false); 
        }, 10000);
      }
    });
  });
}

async function main() {
  console.log("🚀 Starting Auto-Generation Pipeline Loop...");
  console.log("This will continuously run Class 12 to 100%, and then seamlessly switch to Class 11.\n");
  
  // Phase 1: Class 12
  let class12Done = false;
  while (!class12Done) {
    class12Done = await runScheduler('12');
  }
  console.log("\n✅✅ Class 12 is 100% COMPLETE! Moving to Class 11... ✅✅\n");

  // Phase 2: Class 11
  let class11Done = false;
  while (!class11Done) {
    class11Done = await runScheduler('11');
  }
  console.log("\n🎉🎉 Class 11 is 100% COMPLETE! ALL GENERATION FINISHED! 🎉🎉\n");
}

main().catch(console.error);
