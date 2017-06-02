/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import DS from 'ember-data';
import Ember from 'ember';
import Converter from 'yarn-ui/utils/converter';

export default DS.JSONAPISerializer.extend({
  internalNormalizeSingleResponse(store, primaryModelClass, payload) {
    var payloadEvents = payload.events,
        createdEvent = payloadEvents.filterBy('id', 'YARN_RM_CONTAINER_CREATED')[0],
        startedTime = createdEvent? createdEvent.timestamp : Date.now(),
        finishedEvent = payloadEvents.filterBy('id', 'YARN_RM_CONTAINER_FINISHED')[0],
        finishedTime = finishedEvent? finishedEvent.timestamp : Date.now(),
        containerExitStatus = finishedEvent? finishedEvent.info.YARN_CONTAINER_EXIT_STATUS : '',
        containerState = finishedEvent? finishedEvent.info.YARN_CONTAINER_STATE : '';

    var fixedPayload = {
      id: payload.id,
      type: primaryModelClass.modelName,
      attributes: {
        allocatedMB: payload.info.YARN_CONTAINER_ALLOCATED_MEMORY,
        allocatedVCores: payload.info.YARN_CONTAINER_ALLOCATED_VCORE,
        assignedNodeId: payload.info.YARN_CONTAINER_ALLOCATED_HOST,
        priority: payload.info.YARN_CONTAINER_ALLOCATED_PRIORITY,
        startedTime:  Converter.timeStampToDate(startedTime),
        finishedTime: Converter.timeStampToDate(finishedTime),
        nodeHttpAddress: payload.info.YARN_CONTAINER_ALLOCATED_HOST_HTTP_ADDRESS,
        containerExitStatus: containerExitStatus,
        containerState: containerState
      }
    };
    return fixedPayload;
  },

  normalizeSingleResponse(store, primaryModelClass, payload/*, id, requestType*/) {
    var normalized = this.internalNormalizeSingleResponse(store,
        primaryModelClass, payload);
    return {
      data: normalized
    };
  },

  normalizeArrayResponse(store, primaryModelClass, payload/*, id, requestType*/) {
    var normalizedArrayResponse = {
      data: []
    };
    if (payload && Ember.isArray(payload) && !Ember.isEmpty(payload)) {
      normalizedArrayResponse.data = payload.map(singleContainer => {
        return this.internalNormalizeSingleResponse(store, primaryModelClass,
          singleContainer);
      });
    }
    return normalizedArrayResponse;
  }
});