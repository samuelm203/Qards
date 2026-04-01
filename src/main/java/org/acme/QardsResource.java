package org.acme;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;
import java.net.URI;

@Path("/qards")
public class QardsResource {

    @GET
    public Response index() {
        return Response.seeOther(URI.create("/qards/index.html")).build();
    }
}
