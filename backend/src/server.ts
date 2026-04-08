import app from './app';
import { PORT } from './config/env';

app.listen(PORT, () => {
    console.log(`🚀 BEHAVEIQ Backend running on port ${PORT}`);
});
