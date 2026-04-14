import type { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from "express";
import type { Action, Controller, Request } from "../port";

export const expressAdapter = <State, Deps>(
  controller: Controller<State, Deps>,
  deps: Deps,
  action?: Action<State>
) => {
  return async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    const httpRequest: Request = {
      headers: req.headers,
      query: req.query as Request["query"],
      params: req.params,
      body: req.body,
    };

    const state = res.locals as State;

    try {
      const httpResponse = await controller(httpRequest, state, deps);

      action?.(httpRequest, state).catch((err) => console.error("Action error:", err));

      if (httpResponse) {
        if (httpResponse.headers) {
          for (const [key, value] of Object.entries(httpResponse.headers)) {
            res.setHeader(key, value);
          }
        }
        res.status(httpResponse.status).send(httpResponse.body);
      } else {
        next();
      }
    } catch (err) {
      next(err);
    }
  };
};
