import { Controller, Get, Param, Query } from '@nestjs/common';
import { GraphService } from './graph.service';
import { TypeBoxValidationPipe } from '../common/pipes/typebox-validation.pipe';
import { FindCyclesQuerySchema, type FindCyclesQueryDto } from './dto/find-cycles.dto';
import { FindSybilsQuerySchema, type FindSybilsQueryDto } from './dto/find-sybils.dto';
import { FindPeelingChainsQuerySchema, type FindPeelingChainsQueryDto } from './dto/find-peeling-chains.dto';
import { GraphOverviewQuerySchema, type GraphOverviewQueryDto } from './dto/graph-overview.dto';
import { NodeDetailsParamSchema, type NodeDetailsParamDto } from './dto/node-details.dto';
import type {
  GraphData,
  WashRingResult,
  SybilClusterResult,
  PeelingChainResult,
  NodeDetailResponse,
  GraphStats,
} from './graph.types';

@Controller('graph')
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  @Get('overview')
  async getOverview(
    @Query(new TypeBoxValidationPipe(GraphOverviewQuerySchema)) query: GraphOverviewQueryDto,
  ): Promise<GraphData> {
    return this.graphService.getGraphOverview(query);
  }

  @Get('cycles')
  async getWashRings(
    @Query(new TypeBoxValidationPipe(FindCyclesQuerySchema)) query: FindCyclesQueryDto,
  ): Promise<WashRingResult[]> {
    return this.graphService.detectWashRings(query);
  }

  @Get('sybils')
  async getSybilClusters(
    @Query(new TypeBoxValidationPipe(FindSybilsQuerySchema)) query: FindSybilsQueryDto,
  ): Promise<SybilClusterResult[]> {
    return this.graphService.detectSybilClusters(query);
  }

  @Get('peeling-chains')
  async getPeelingChains(
    @Query(new TypeBoxValidationPipe(FindPeelingChainsQuerySchema)) query: FindPeelingChainsQueryDto,
  ): Promise<PeelingChainResult[]> {
    return this.graphService.detectPeelingChains(query);
  }

  @Get('stats')
  async getStats(): Promise<GraphStats> {
    return this.graphService.getStats();
  }

  @Get('node/:address')
  async getNodeDetails(
    @Param(new TypeBoxValidationPipe(NodeDetailsParamSchema)) params: NodeDetailsParamDto,
  ): Promise<NodeDetailResponse> {
    return this.graphService.getNodeDetails(params.address);
  }
}
