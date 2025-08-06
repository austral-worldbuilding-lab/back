const { exec, spawn } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function deploy() {
  try {
    console.log('🚀 Starting deployment process...');
    console.log('📦 Installing production dependencies...');
    
    const { stdout: npmOutput } = await execPromise('npm ci --omit=dev --prefer-offline --no-audit --no-optional', { 
      timeout: 300000 // 5 minutes timeout for npm install
    });
    console.log('✅ Dependencies installed successfully');
    
    console.log('🔧 Generating Prisma Client...');
    await execPromise('npx prisma generate');
    console.log('✅ Prisma Client generated');
    
    console.log('🗄️ Running database migrations...');
    const { stdout: migrateOutput } = await execPromise('npx prisma migrate deploy');
    console.log('Migration output:', migrateOutput);
    console.log('✅ Database migrations completed');
    
    console.log('🎯 Starting NestJS application...');
    
    // Start the NestJS application
    const app = spawn('node', ['dist/src/main.js'], { 
      stdio: 'inherit',
      env: { 
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    app.on('error', (error) => {
      console.error('❌ Application failed to start:', error);
      process.exit(1);
    });
    
    app.on('exit', (code, signal) => {
      if (code !== 0) {
        console.error(`❌ Application exited with code ${code} and signal ${signal}`);
        process.exit(1);
      }
    });
    
    console.log('✅ Application started successfully');
    
  } catch (error) {
    console.error('❌ Deployment failed at step:', error.message);
    console.error('Full error details:', error);
    
    // Log more specific error information
    if (error.code === 'ETIMEDOUT') {
      console.error('💡 Suggestion: The operation timed out. Consider increasing WEBSITES_CONTAINER_START_TIME_LIMIT in Azure');
    } else if (error.message.includes('npm')) {
      console.error('💡 Suggestion: NPM installation failed. Check network connectivity and package.json');
    } else if (error.message.includes('prisma')) {
      console.error('💡 Suggestion: Prisma operation failed. Check DATABASE_URL and database connectivity');
    }
    
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log('🏁 Deploy script starting...');
deploy(); 