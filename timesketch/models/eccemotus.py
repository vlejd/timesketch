# Copyright 2015 Google Inc. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""This module implements the models for storing eccemotus graph."""

from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import Unicode
from sqlalchemy import UnicodeText
from sqlalchemy.orm import relationship

from timesketch.models import BaseModel
from timesketch.models.acl import AccessControlMixin
from timesketch.models.annotations import StatusMixin


class EccemotusGraph(AccessControlMixin, StatusMixin, BaseModel):
    """Implements the EccemotusGraph model."""
    indices = Column(UnicodeText())
    query_dict = Column(UnicodeText())
    data = Column(UnicodeText())
    user_id = Column(Integer, ForeignKey(u'user.id'))

    def __init__(self, indices, query_dict):
        """Initialize the EccemotusGraph object.

        Args: TODO
            indices: List of indices.
            user: A user (instance of timesketch.models.user.User).
            query_dict: Dict specifying elasticsearch query.
        """
        super(EccemotusGraph, self).__init__()
        self.indices = indices
        self.query_dict = query_dict
        self.data = u''

