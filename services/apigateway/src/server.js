const app = require("./app");
const { port } = require("./config/env");
const { authServiceUrl } = require("./config/env");
const { productServiceUrl } = require("./config/env");

app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
  console.log(`Auth Service: ${authServiceUrl}`);
  console.log(`Product Service: ${productServiceUrl}`);
});
