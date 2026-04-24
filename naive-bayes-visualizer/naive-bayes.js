// Gaussian Naive Bayes Classifier
class NaiveBayes {
    constructor() {
        this.classes = [];
        this.priors = {};
        this.means = {};
        this.variances = {};
        this.trained = false;
    }

    train(data) {
        // data: [{x, y, label}]
        const grouped = {};
        data.forEach(p => {
            if (!grouped[p.label]) grouped[p.label] = [];
            grouped[p.label].push(p);
        });
        this.classes = Object.keys(grouped).map(Number).sort();
        const total = data.length;

        this.classes.forEach(c => {
            const pts = grouped[c];
            this.priors[c] = pts.length / total;

            const xs = pts.map(p => p.x);
            const ys = pts.map(p => p.y);

            const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
            const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;

            const varX = xs.reduce((a, b) => a + (b - meanX) ** 2, 0) / xs.length + 1e-6;
            const varY = ys.reduce((a, b) => a + (b - meanY) ** 2, 0) / ys.length + 1e-6;

            this.means[c] = { x: meanX, y: meanY };
            this.variances[c] = { x: varX, y: varY };
        });

        this.trained = true;
    }

    gaussianPDF(x, mean, variance) {
        const coeff = 1 / Math.sqrt(2 * Math.PI * variance);
        const exponent = -((x - mean) ** 2) / (2 * variance);
        return coeff * Math.exp(exponent);
    }

    predict(x, y) {
        if (!this.trained) return null;
        const posteriors = this.getPosteriors(x, y);
        let bestClass = this.classes[0];
        let bestProb = -1;
        for (const c of this.classes) {
            if (posteriors[c] > bestProb) {
                bestProb = posteriors[c];
                bestClass = c;
            }
        }
        return bestClass;
    }

    getPosteriors(x, y) {
        const logPosteriors = {};
        this.classes.forEach(c => {
            const logPrior = Math.log(this.priors[c]);
            const logLikX = Math.log(this.gaussianPDF(x, this.means[c].x, this.variances[c].x));
            const logLikY = Math.log(this.gaussianPDF(y, this.means[c].y, this.variances[c].y));
            logPosteriors[c] = logPrior + logLikX + logLikY;
        });

        // Log-sum-exp trick for normalization
        const maxLog = Math.max(...Object.values(logPosteriors));
        const sumExp = Object.values(logPosteriors).reduce((s, v) => s + Math.exp(v - maxLog), 0);
        const logNorm = maxLog + Math.log(sumExp);

        const posteriors = {};
        this.classes.forEach(c => {
            posteriors[c] = Math.exp(logPosteriors[c] - logNorm);
        });
        return posteriors;
    }

    getAccuracy(data) {
        if (!this.trained) return 0;
        let correct = 0;
        data.forEach(p => {
            if (this.predict(p.x, p.y) === p.label) correct++;
        });
        return correct / data.length;
    }
}
