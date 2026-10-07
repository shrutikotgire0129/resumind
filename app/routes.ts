import {type RouteConfig, index, route} from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route('/auth', 'routes/auth.tsx'),
    route('/upload', 'routes/upload.tsx'),
    route('/resume/:id', 'routes/resume.tsx'),
    route('/job-analyzer', 'routes/job-analyzer.tsx'),
    route('/wipe', 'routes/wipe.tsx'),
    route("/api/job-match", "routes/api.job-match.ts"),
    route("/api/resume-analysis", "routes/api.resume-analysis.ts"),
    route("/api/resume-improve", "routes/api.resume-improve.ts"),
    route("/api/resume-extract", "routes/api.resume-extract.ts"),
    route("/applications", "routes/applications.tsx"),
    route("/analytics", "routes/analytics.tsx"),
] satisfies RouteConfig;