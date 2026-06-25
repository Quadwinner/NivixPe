# Chaincode-as-a-Service image for the nivix-kyc chaincode.
# Built by `network.sh deployCCAAS` on the host Docker daemon (avoids the
# peer-side docker build that breaks against newer Docker daemons).
ARG GO_VER=1.23
ARG ALPINE_VER=3.21

FROM golang:${GO_VER}-alpine${ALPINE_VER} AS build

WORKDIR /src
COPY . .

# Build using the vendored dependencies committed alongside the chaincode,
# so the image build needs no network access.
RUN CGO_ENABLED=0 GOFLAGS=-mod=vendor go build -o /chaincode-server .

FROM alpine:${ALPINE_VER}
RUN apk add --no-cache ca-certificates
COPY --from=build /chaincode-server /chaincode-server

# Documentation only; the real listen address is supplied at runtime via the
# CHAINCODE_SERVER_ADDRESS env var set by deployCCAAS.
ARG CC_SERVER_PORT=9999
EXPOSE ${CC_SERVER_PORT}

CMD ["/chaincode-server"]
